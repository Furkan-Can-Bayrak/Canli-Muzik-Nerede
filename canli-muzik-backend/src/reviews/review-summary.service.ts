import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ReviewTargetType } from '@prisma/client';

export type ReviewForSummary = {
  rating: number;
  body: string | null;
};

@Injectable()
export class ReviewSummaryService {
  private readonly logger = new Logger(ReviewSummaryService.name);

  async generateSummary(
    targetLabel: string,
    reviews: ReviewForSummary[],
  ): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set; skipping summary generation');
      return null;
    }

    const lines = reviews.map((r, i) => {
      const text = r.body?.trim() ? r.body.trim() : '(yorum metni yok)';
      return `${i + 1}. ${r.rating}/5 yıldız — ${text}`;
    });

    const prompt = `Sen bir müzik etkinliği platformunun yorum özetleyicisisin. Aşağıda "${targetLabel}" hakkında kullanıcı yorumları var.

Yorumlar:
${lines.join('\n')}

Görev: Bu yorumları okuyup 2-4 cümlelik, nötr ve bilgilendirici bir Türkçe özet yaz. Güçlü yönleri ve eleştirileri dengeli yansıt. Kişisel veri veya yorumcu ismi kullanma. Sadece özeti yaz, başlık veya madde işareti kullanma.`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text()?.trim();
      return text || null;
    } catch (err) {
      this.logger.error('Gemini summary generation failed', err);
      return null;
    }
  }

  targetLabel(
    targetType: ReviewTargetType,
    bandName?: string | null,
    cafeName?: string | null,
  ): string {
    if (targetType === 'BAND') return bandName?.trim() || 'Grup';
    return cafeName?.trim() || 'Mekân';
  }
}
