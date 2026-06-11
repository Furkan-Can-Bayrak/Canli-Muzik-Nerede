import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.genre.findMany({ orderBy: { name: 'asc' } });
  }

  /** Liste API — statik /genres/*.webp dosyalarından ayrı tutulur */
  @Get('catalog')
  catalog() {
    return this.list();
  }
}

