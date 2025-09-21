import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/files/fetch/{studentId}:
 *   get:
 *     summary: Retrieve all files for a specific student
 *     tags:
 *       - Files
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the student whose files are to be fetched
 *     responses:
 *       200:
 *         description: A list of files belonging to the student
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   file_url:
 *                     type: string
 *                     description: URL of the uploaded file
 *                   file_name:
 *                     type: string
 *                     description: Name of the file stored in MinIO
 *                   type:
 *                     type: string
 *                     description: Document type (e.g., KTM, KTP)
 *       400:
 *         description: Invalid student ID provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid student ID"
 *       500:
 *         description: Server error fetching files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
export async function GET(_: NextRequest, context: { params: { studentId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const { studentId } = await context.params;
    const id = parseInt(studentId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (userRole === "Mahasiswa" && userId != studentId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (userRole === "Pewawancara") {
      const interviewExists = await prisma.interviewSlot.findFirst({
        where: {
          user_id: parseInt(userId),
          student_id: id,
        },
      });

      if (!interviewExists) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    // Admins like "Pengurus_IOM" bypass the check
    const files = await prisma.file.findMany({
      where: { student_id: id },
      select: {
        file_url: true,
        file_name: true,
        type: true,
      },
    });

    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    console.error("Error fetching student files:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
