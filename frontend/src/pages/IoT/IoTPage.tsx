import { useState, FormEvent } from 'react';
import { CpuChipIcon, PlusIcon, TrashIcon, SignalIcon } from '@heroicons/react/24/outline';
import { useIoTDevices } from '../../hooks/useIoTDevices';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { iotDeviceApi } from '../../services/api';

const emptyForm = { deviceCode: '', deviceType: 'TEMP_SENSOR' };

export const IoTPage = () => {
  const { selectedCompany } = useAuthStore();
  const { devices, isLoading, registerDevice, deleteDevice } = useIoTDevices();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [readingsFor, setReadingsFor] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await registerDevice(form);
    setForm(emptyForm);
    setModalOpen(false);
  };

  const viewReadings = async (device: any) => {
    setReadingsFor(device);
    const res: any = await iotDeviceApi.getReadings(device.id);
    setReadings(res.data || []);
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center py-12">
        <CpuChipIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700">Select a company first</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">IoT Devices</h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> Register Device
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Device Code</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Last Seen</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {devices.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-secondary-500">No devices registered</td></tr>}
                {devices.map((d: any) => (
                  <tr key={d.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{d.deviceCode}</td>
                    <td className="px-4 py-3 text-sm">{d.deviceType}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full w-fit ${
                        d.status === 'ONLINE' ? 'bg-success-50 text-success-700' : 'bg-secondary-100 text-secondary-600'
                      }`}>
                        <SignalIcon className="w-3 h-3" /> {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-500">{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : 'Never'}</td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => viewReadings(d)} className="btn-secondary text-xs py-1 px-3">Readings ({d._count?.readings || 0})</button>
                        <button onClick={() => deleteDevice(d.id)} className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register IoT Device">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Device Code</label>
            <input className="form-input" required value={form.deviceCode} onChange={(e) => setForm({ ...form, deviceCode: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Device Type</label>
            <select className="form-input" value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })}>
              <option value="TEMP_SENSOR">Temperature Sensor</option>
              <option value="RFID_READER">RFID Reader</option>
              <option value="WEIGHT_SCALE">Weight Scale</option>
              <option value="BARCODE_SCANNER">Barcode Scanner</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Register</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!readingsFor} onClose={() => setReadingsFor(null)} title={`Readings: ${readingsFor?.deviceCode || ''}`}>
        {readings.length === 0 ? (
          <p className="text-secondary-500 text-center py-8">No readings recorded yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {readings.map((r: any) => (
              <div key={r.id} className="flex justify-between p-2 bg-secondary-50 rounded-lg text-sm">
                <span>{r.metric}</span>
                <span className="font-semibold">{Number(r.value)} {r.unit}</span>
                <span className="text-secondary-400 text-xs">{new Date(r.recordedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
