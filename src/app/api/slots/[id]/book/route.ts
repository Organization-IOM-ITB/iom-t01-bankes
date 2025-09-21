import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();
/**
 * @swagger
 * paths:
 *   /api/slots/{id}/book:
 *     post:
 *       tags:
 *         - Slots
 *       summary: Book a specific slot for a student
 *       security:
 *         - CookieAuth: []
 *       parameters:
 *         - name: id
 *           in: path
 *           description: Numeric ID of the interview slot to book
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         '200':
 *           description: Slot booked successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     const: true
 *                   data:
 *                     $ref: '#/components/schemas/InterviewSlot'
 *         '400':
 *           description: Invalid input or slot already booked or student already has a booking
 *           content:
 *             application/json:
 *               schema:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/ErrorResponse'
 *                   - type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                         const: false
 *                       error:
 *                         type: string
 *                       existingSlotId:
 *                         type: integer
 *         '401':
 *           description: Unauthorized (not a student or not authenticated)
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '404':
 *           description: Slot not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '500':
 *           description: Server error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 */
// POST /api/slots/[id]/book - Book a slot
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Awaiting the params
  ) {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user?.id || session.user.role !== "Mahasiswa") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
  
      const { id } = await params; // Await params before using id
      const slotId = Number(id);
      if (isNaN(slotId)) {
        return NextResponse.json(
          { success: false, error: "Invalid slot ID" },
          { status: 400 }
        );
      }
  
      // Check if slot exists and is available
      const slot = await prisma.interviewSlot.findUnique({
        where: { id: slotId },
      });
  
      if (!slot) {
        return NextResponse.json(
          { success: false, error: "Slot not found" },
          { status: 404 }
        );
      }
  
      if (slot.student_id) {
        return NextResponse.json(
          { success: false, error: "Slot already booked" },
          { status: 400 }
        );
      }
  
      // Check if student has already booked another slot in the same period
      const existingBooking = await prisma.interviewSlot.findFirst({
        where: {
          period_id: slot.period_id,
          student_id: Number(session.user.id),
        },
      });
  
      if (existingBooking) {
        return NextResponse.json(
          { 
            success: false, 
            error: "You already have a booking for this period",
            existingSlotId: existingBooking.id
          },
          { status: 400 }
        );
      }
  
      // Book the slot
      const updatedSlot = await prisma.interviewSlot.update({
        where: { id: slotId },
        data: {
          student_id: Number(session.user.id),
          booked_at: new Date(),
        },
      });

      // Create notes for the interview
      await prisma.notes.create({
        data: {
          slot_id: slotId,
          user_id: Number(session.user.id),
          text: JSON.stringify({
            namaPewawancara:"", 
            noHpPewawancara:"",
            namaMahasiswa:"",
            nim:"",
            noHpMahasiswa:"",
            jenisKelamin:"",
            prodiFakultas:"",
            ipk:"",
            permasalahan:"",
            jalurMasukITB:"",
            prestasiAkademik:"",
            kegiatanEkstrakulikuler:"",
            kesimpulanKegiatanEkstrakulikuler:"",
            besarUKTYangSudahDibayar:"",
            asalSMA:"",
            alamatDiBandung:"",
            statusTempatTinggalDiBandung:"",
            biayaKost:"",
            jarakTempatTinggal:"",
            pergiKeKampus:"",
            kirimanUang:"",
            kirimanOrangTuaMakan:false,
            kirimanOrangTuaKost:false,
            kirimanOrangTuaTransport:false,
            kirimanOrangTuaPerkuliahan:false,
            kirimanOrangTuaKesehatan:false,
            apakahMendapatBeasiswa:"",
            apabilaIyaBerapa:"",
            bantuanYangPernahdidapatkan:"",
            jelaskanMasalah:"",
            bantuanYangDiminta:"",
            namaOrangTua:"",
            alamatOrangTua:"",
            noHPOrangTua:"",
            statusRumahOrangTua:"",
            sumberPenghasilanOrangTua:"",
            tuliskanNamaLokasi:"",
            apakahMahasiswaDapat:"",
            penghasilanOrangTua:"",
            jumlahPembayaranListrik:"",
            jumlahPembayaranPBB:"",
            tanggunganKeluarga:"",
            apakahDiRumah:"",
            kesimpulanKemampuanEkonomi:"",
            kesimpulanKecukupanBiayaHidup:"",
            kesimpulanPenggunaanDana:"",
            kesimpulanMotivasiPribadi:"",
            dukunganDariLingkungan:"",
            keinginanUntukMembantu:"",
            keinginanUntukBerkontribusi:"",
            tuliskanHalHalYangDidapat:"",
            rekomendasiUntukMendapat:"",
            besaranBeasiswa:"",
            rekomendasiUntukJenis:"",
          })
        }
      });
  
      return NextResponse.json({
        success: true,
        data: updatedSlot,
      });
    } catch (error) {
      console.error("Error booking slot:", error);
      return NextResponse.json(
        { success: false, error: "Failed to book slot" },
        { status: 500 }
      );
    }
  }
