/**
 * @swagger
 * tags:
 *   name: Approvals
 *   description: Approval workflow management
 */

/**
 * @swagger
 * /approvals/workflows:
 *   get:
 *     summary: Get all workflows
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of workflows
 *   post:
 *     summary: Create a new workflow
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               documentType:
 *                 type: string
 *               states:
 *                 type: array
 *               transitions:
 *                 type: array
 *     responses:
 *       201:
 *         description: Workflow created
 */

/**
 * @swagger
 * /approvals/submit:
 *   post:
 *     summary: Submit document for approval
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentType:
 *                 type: string
 *               documentId:
 *                 type: string
 *               workflowId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Submitted for approval
 */

/**
 * @swagger
 * /approvals/{id}/action:
 *   post:
 *     summary: Process approval action
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT, REQUEST_CHANGE]
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval processed
 */

/**
 * @swagger
 * /approvals/pending:
 *   get:
 *     summary: Get pending approvals
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending approvals
 */
