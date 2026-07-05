/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: System and company settings
 */

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get all settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Settings retrieved
 *   put:
 *     summary: Update setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: any
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting updated
 */

/**
 * @swagger
 * /settings/company:
 *   get:
 *     summary: Get company settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company settings
 *   put:
 *     summary: Update company settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: Company settings updated
 */
