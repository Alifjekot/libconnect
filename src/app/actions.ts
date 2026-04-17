"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper to check for Prisma error codes without 'any'
function isPrismaError(error: unknown): error is { code: string; message: string; meta?: unknown } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export async function checkStudent(identifier: string) {
  try {
    // Check if it's a numeric ID (noAhli) or IC
    const isNumeric = /^\d+$/.test(identifier);
    
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { ic: identifier },
          { noAhli: isNumeric ? parseInt(identifier) : undefined }
        ]
      },
    });
    return { exists: !!student, student };
  } catch (error) {
    let message = "Gagal menyemak status pelajar.";
    if (error instanceof Error) message = error.message;
    return { exists: false, error: message };
  }
}

export async function registerStudent(data: { ic: string; name: string; kelas: string; umur: number; role?: string }) {
  try {
    // Get next noAhli
    const lastStudent = await prisma.student.findFirst({
      orderBy: { noAhli: 'desc' },
      where: { noAhli: { not: null } }
    });
    
    const nextNoAhli = (lastStudent?.noAhli || 0) + 1;

    const student = await prisma.student.create({
      data: {
        ic: data.ic,
        name: data.name,
        kelas: data.kelas,
        umur: data.umur,
        role: data.role || "MURID",
        noAhli: nextNoAhli,
      },
    });
    return { success: true, student };
  } catch (error) {
    let userErrorMessage = "Gagal mendaftar: Ralat tidak diketahui";
    if (isPrismaError(error)) {
      if (error.code === 'P2002') {
        userErrorMessage = "No. KP atau No. Ahli sudah didaftarkan.";
      } else {
        userErrorMessage = `Gagal mendaftar: ${error.message}`;
      }
    } else if (error instanceof Error) {
      userErrorMessage = `Gagal mendaftar: ${error.message}`;
    }

    console.error("Register student error:", error);
    return {
      success: false,
      error: userErrorMessage
    };
  }
}

export async function submitAttendance(identifier: string, purpose: string) {
  try {
    const isNumeric = /^\d+$/.test(identifier);
    
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { ic: identifier },
          { noAhli: isNumeric ? parseInt(identifier) : undefined }
        ]
      },
    });

    if (!student) {
      return { success: false, error: "Pelajar tidak dijumpai. Sila daftar terlebih dahulu.", needsRegistration: true };
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId: student.id,
        purpose,
      },
    });

    revalidatePath("/");
    return { success: true, attendance };
  } catch (error) {
    console.error("Attendance submission error:", error);
    return { success: false, error: "Gagal merekod kehadiran." };
  }
}

export async function getMonthlyRanking() {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const rankings = await prisma.attendance.groupBy({
      by: ['studentId'],
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
      _count: {
        studentId: true,
      },
      orderBy: {
        _count: {
          studentId: 'desc',
        },
      },
      take: 10,
    });

    const studentIds = rankings.map((r: { studentId: string }) => r.studentId);
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
      },
    });

    return rankings.map((rank: { studentId: string; _count: { studentId: number } }) => {
      const student = students.find((s: { id: string }) => s.id === rank.studentId);
      return {
        ic: student?.ic || "Unknown",
        noAhli: student?.noAhli ?? null,
        name: student?.name || student?.ic || "Unknown",
        count: rank._count.studentId,
      };
    });
  } catch (error) {
    console.error("Ranking fetch error:", error);
    return [];
  }
}

interface StudentWithStats {
  id: string;
  name: string;
  kelas: string;
  umur: number;
  ic: string;
  _count?: {
    attendances: number;
  };
}

export async function getStudentsWithStats(period: 'daily' | 'weekly' | 'monthly' | 'all' = 'all') {
  try {
    const now = new Date();
    let startDate: Date | undefined;

    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    }

    const students = await prisma.student.findMany({
      include: {
        _count: {
          select: {
            attendances: startDate ? {
              where: {
                createdAt: { gte: startDate }
              }
            } : true
          }
        }
      }
    });

    // Sort by attendance count descending
    return [...students].sort((a, b) => {
      const bCount = (b as unknown as StudentWithStats)._count?.attendances || 0;
      const aCount = (a as unknown as StudentWithStats)._count?.attendances || 0;
      return bCount - aCount;
    });
  } catch (error) {
    console.error("Fetch students with stats error:", error);
    return [];
  }
}

export async function updateStudent(id: string, data: { name: string; kelas: string; umur: number }) {
  try {
    await prisma.student.update({
      where: { id },
      data: {
        name: data.name,
        kelas: data.kelas,
        umur: data.umur,
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Update student error:", error);
    return { success: false, error: "Gagal mengemaskini pelajar." };
  }
}

export async function deleteStudent(id: string) {
  try {
    await prisma.attendance.deleteMany({
      where: { studentId: id }
    });
    await prisma.student.delete({
      where: { id },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Delete student error:", error);
    return { success: false, error: "Gagal memadam pelajar." };
  }
}

export async function importStudents(students: { ic: string; name: string; kelas: string; umur: number }[]) {
  try {
    let insertedCount = 0;
    for (const s of students) {
      await prisma.student.upsert({
        where: { ic: s.ic },
        update: {
          name: s.name,
          kelas: s.kelas,
          umur: s.umur,
        },
        create: {
          ic: s.ic,
          name: s.name,
          kelas: s.kelas,
          umur: s.umur,
        },
      });
      insertedCount++;
    }
    revalidatePath("/admin");
    return { success: true, count: insertedCount };
  } catch (error) {
    console.error("Import error:", error);
    return { success: false, error: "Gagal mengimport data." };
  }
}

export async function getStudentsByClass(kelas: string) {
  try {
    return await prisma.student.findMany({
      where: { kelas, role: "MURID" },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error("Fetch by class error:", error);
    return [];
  }
}

export async function submitBulkAttendance(studentIds: string[], purpose: string) {
  try {
    const data = studentIds.map(id => ({
      studentId: id,
      purpose,
    }));

    await prisma.attendance.createMany({
      data,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Bulk attendance error:", error);
    return { success: false, error: "Gagal merekod kehadiran pukal." };
  }
}

export async function getAttendanceStats() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailyCount = await prisma.attendance.count({
      where: {
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    const mCount = await prisma.attendance.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    return { dailyCount, monthlyCount: mCount };
  } catch (error) {
    console.error("Stats fetch error:", error);
    return { dailyCount: 0, monthlyCount: 0 };
  }
}
