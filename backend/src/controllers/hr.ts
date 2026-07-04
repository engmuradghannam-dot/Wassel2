import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// ==================== Attendance ====================

const attendanceSchema = z.object({
  employeeId: z.string(),
  date: z.string().datetime(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY']),
  notes: z.string().optional(),
});

export const createAttendance = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = attendanceSchema.parse(req.body);

    let workHours: number | undefined;
    if (data.checkIn && data.checkOut) {
      workHours = (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / (1000 * 60 * 60);
    }

    const attendance = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: data.employeeId, date: new Date(data.date) } },
      create: {
        ...data,
        date: new Date(data.date),
        checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
        checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
        workHours,
      },
      update: {
        checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
        checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
        status: data.status,
        workHours,
        notes: data.notes,
      },
    });

    res.status(201).json(successResponse(attendance, 'Attendance recorded'));
  } catch (error) {
    next(error);
  }
};

export const getAttendance = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.body?.companyId || req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);
    const employeeId = req.query.employeeId as string | undefined;

    const records = await prisma.attendance.findMany({
      where: {
        employee: { companyId },
        ...(employeeId ? { employeeId } : {}),
      },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
      orderBy: { date: 'desc' },
      take: 200,
    });

    res.json(successResponse(records));
  } catch (error) {
    next(error);
  }
};

// ==================== Leaves ====================

const leaveSchema = z.object({
  employeeId: z.string(),
  leaveType: z.enum(['ANNUAL', 'SICK', 'EMERGENCY', 'UNPAID', 'MATERNITY', 'PATERNITY', 'HAJJ', 'OTHER']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
});

export const createLeave = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = leaveSchema.parse(req.body);
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const leave = await prisma.leave.create({
      data: { ...data, startDate: start, endDate: end, days },
    });

    res.status(201).json(successResponse(leave, 'Leave request submitted'));
  } catch (error) {
    next(error);
  }
};

export const getLeaves = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.body?.companyId || req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const leaves = await prisma.leave.findMany({
      where: { employee: { companyId } },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(leaves));
  } catch (error) {
    next(error);
  }
};

export const updateLeaveStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']) }).parse(req.body);
    const leave = await prisma.leave.update({
      where: { id },
      data: { status, approvedById: status === 'APPROVED' ? req.user.userId : undefined, approvedAt: status === 'APPROVED' ? new Date() : undefined },
    });
    res.json(successResponse(leave, 'Leave status updated'));
  } catch (error) {
    next(error);
  }
};

// ==================== Payroll (Saudi GOSI) ====================

const payrollSchema = z.object({
  employeeId: z.string(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  overtimePay: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  otherDeductions: z.number().min(0).default(0),
});

// Saudi GOSI (2024 rates, post-reform): Saudi employees contribute 9.75% of
// (basic + housing), employer contributes 11.75% (9% annuities + 2.75%
// unemployment/SANED). Non-Saudi employees: no employee contribution, employer
// pays 2% occupational hazard only. This is a simplified approximation for
// payroll estimation, not a substitute for official GOSI portal calculation.
function calculateGosi(nationality: string, basicSalary: number, housingAllowance: number) {
  const gosiBase = basicSalary + housingAllowance;
  const isSaudi = nationality === 'SA';
  const gosiEmployee = isSaudi ? gosiBase * 0.0975 : 0;
  const gosiCompany = isSaudi ? gosiBase * 0.1175 : gosiBase * 0.02;
  return { gosiEmployee, gosiCompany };
}

export const createPayroll = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = payrollSchema.parse(req.body);

    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new AppError('Employee not found', 404);

    const basicSalary = Number(employee.basicSalary);
    const housingAllowance = Number(employee.housingAllowance);
    const transportAllowance = Number(employee.transportAllowance);
    const otherAllowance = Number(employee.otherAllowance);

    const totalEarnings = basicSalary + housingAllowance + transportAllowance + otherAllowance + data.overtimePay + data.bonus;
    const { gosiEmployee, gosiCompany } = calculateGosi(employee.nationality, basicSalary, housingAllowance);
    const totalDeductions = gosiEmployee + data.otherDeductions;
    const netSalary = totalEarnings - totalDeductions;

    const payroll = await prisma.payroll.create({
      data: {
        employeeId: data.employeeId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        basicSalary, housingAllowance, transportAllowance, otherAllowance,
        overtimePay: data.overtimePay, bonus: data.bonus, totalEarnings,
        gosiEmployee, gosiCompany, otherDeductions: data.otherDeductions, totalDeductions,
        netSalary,
      },
    });

    res.status(201).json(successResponse(payroll, 'Payroll generated'));
  } catch (error) {
    next(error);
  }
};

export const getPayrolls = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.body?.companyId || req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const payrolls = await prisma.payroll.findMany({
      where: { employee: { companyId } },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
      orderBy: { periodStart: 'desc' },
    });

    res.json(successResponse(payrolls));
  } catch (error) {
    next(error);
  }
};

export const markPayrollPaid = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const payroll = await prisma.payroll.update({ where: { id }, data: { status: 'PAID' } });
    res.json(successResponse(payroll, 'Payroll marked as paid'));
  } catch (error) {
    next(error);
  }
};

// End-of-Service (EOS) estimate per Saudi labor law: half-month salary per
// year for the first 5 years, one full month per year after that. This is an
// estimate for planning purposes only, not a legal/final settlement figure.
export const getEndOfServiceEstimate = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new AppError('Employee not found', 404);

    const yearsOfService = (Date.now() - new Date(employee.dateOfJoining).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const monthlySalary = Number(employee.totalSalary);
    const first5Years = Math.min(yearsOfService, 5);
    const remainingYears = Math.max(yearsOfService - 5, 0);
    const estimate = (first5Years * 0.5 * monthlySalary) + (remainingYears * monthlySalary);

    res.json(successResponse({
      yearsOfService: Math.round(yearsOfService * 100) / 100,
      monthlySalary,
      estimatedEndOfService: Math.round(estimate * 100) / 100,
      note: 'تقدير أولي حسب نظام العمل السعودي - لا يغني عن الحساب الرسمي عند نهاية الخدمة الفعلية',
    }));
  } catch (error) {
    next(error);
  }
};
