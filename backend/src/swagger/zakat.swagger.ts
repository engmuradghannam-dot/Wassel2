/**
 * @swagger
 * tags:
 *   name: Zakat
 *   description: Zakat calculation and reports
 */

/**
 * @swagger
 * /zakat/calculate:
 *   post:
 *     summary: Calculate Zakat
 *     tags: [Zakat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ZakatCalculation'
 *     responses:
 *       200:
 *         description: Zakat calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /zakat/history:
 *   get:
 *     summary: Get Zakat calculation history
 *     tags: [Zakat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Zakat history
 */

/**
 * @swagger
 * /zakat/report/{year}:
 *   get:
 *     summary: Get Zakat report for a year
 *     tags: [Zakat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Zakat report
 */
