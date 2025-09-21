import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';

const prisma = new PrismaClient();

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
});

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     CookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: next-auth.session-token

 * paths:
 *   /api/files/delete:
 *     delete:
 *       tags:
 *         - Files
 *       summary: Delete a student's uploaded file by type
 *       security:
 *         - CookieAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileType:
 *                   type: string
 *                   description: The type of file to delete (e.g., TRANSKRIP, CV)
 *       responses:
 *         '200':
 *           description: File deleted successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                   message:
 *                     type: string
 *         '400':
 *           description: Missing or invalid file type
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '401':
 *           description: Unauthorized access
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '404':
 *           description: File not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '500':
 *           description: Server error during deletion
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const studentId = Number(session.user.id);
    const { fileType } = await request.json();

    if (!fileType) {
      return NextResponse.json({ error: "Missing file type" }, { status: 400 });
    }

    const fileRecord = await prisma.file.findFirst({
      where: { student_id: studentId, type: fileType }
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const bucketName = process.env.MINIO_BUCKET_NAME || "iom-itb";

    await minioClient.removeObject(bucketName, fileRecord.file_name);

    await prisma.file.delete({
      where: { 
        file_id: fileRecord.file_id,
      }
    });

    return NextResponse.json({ success: true, message: "File deleted successfully" });
    
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Deletion failed' },
      { status: 500 }
    );
  }
}
