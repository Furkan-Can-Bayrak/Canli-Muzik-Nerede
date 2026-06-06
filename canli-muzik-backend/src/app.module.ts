import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LocationsModule } from './locations/locations.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { GenresModule } from './genres/genres.module';
import { BandsModule } from './bands/bands.module';
import { CafesModule } from './cafes/cafes.module';
import { EventsModule } from './events/events.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    LocationsModule,
    GeocodingModule,
    GenresModule,
    BandsModule,
    CafesModule,
    EventsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
