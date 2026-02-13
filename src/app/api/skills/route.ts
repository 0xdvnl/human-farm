import { NextResponse } from 'next/server';
import { SKILL_CATEGORIES, ALL_SKILLS } from '@/types';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      categories: SKILL_CATEGORIES,
      all_skills: ALL_SKILLS,
    },
  });
}
