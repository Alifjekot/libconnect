"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function checkStudent(ic: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { ic },
    });
    return { exists: !!student, student };
  } catch (error: any) {
    console.error("Check student error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return { exists: false, error: "Gagal menyemak status pelajar." };
  }
}

export async function registerStudent(data: { ic: string; name: string; kelas: string; umur: number }) {
  try {
    const student = await prisma.student.create({
      data: {
        ic: data.ic,
        name: data.name,
        kelas: data.kelas,
        umur: data.umur,
      },
    });
    return { success: true, student };
  } catch (error: any) {
    console.error("Register student error:", error);
    return { 
      success: false, 
      error: error.code === 'P2002' 
        ? "No. Kad Pengenalan ini sudah didaftarkan." 
        : `Gagal mendaftar pelajar: ${error.message || "Ralat tidak diketahui"}` 
    };
  }
}

export async function submitAttendance(ic: string, purpose: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { ic },
    });

    if (!student) {
      return { success: false, error: "Pelajar tidak dijumpai. Sila daftar terlebih dahulu.", needsRegistration: true };
    }

    await prisma.attendance.create({
      data: {
        studentId: student.id,
        purpose,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Attendance submission error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
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
        name: student?.name || student?.ic || "Unknown",
        count: rank._count.studentId,
      };
    });
  } catch (error) {
    console.error("Ranking fetch error:", error);
    return [];
  }
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
    return students.sort((a, b) => (b._count?.attendances || 0) - (a._count?.attendances || 0));
  } catch (error: any) {
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
  } catch (error: any) {
    console.error("Update student error:", error);
    return { success: false, error: "Gagal mengemaskini pelajar." };
  }
}

export async function deleteStudent(id: string) {
  try {
    // Delete attendances first due to relation
    await prisma.attendance.deleteMany({
      where: { studentId: id }
    });
    await prisma.student.delete({
      where: { id },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Delete student error:", error);
    return { success: false, error: "Gagal memadam pelajar." };
  }
}

export async function importStudents(students: { ic: string; name: string; kelas: string; umur: number }[]) {
  try {
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
    }
    revalidatePath("/admin");
    return { success: true, count: students.length };
  } catch (error: any) {
    console.error("Import students error:", error);
    return { success: false, error: "Gagal mengimport data." };
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

    const monthlyCount = await prisma.attendance.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    return { dailyCount, monthlyCount };
  } catch (error) {
    console.error("Stats fetch error:", error);
    return { dailyCount: 0, monthlyCount: 0 };
  }
}
