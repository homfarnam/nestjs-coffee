import { Module } from '@nestjs/common';
import { CoffeesModule } from 'src/coffees/coffees.module';
import { DatabaseModule } from 'src/database/database.module';
import { CoffeeRatingService } from './coffee-rating.service';

@Module({
  imports: [
    CoffeesModule,
    DatabaseModule.register({
      type: 'postgres',
      host: 'locahost',
      password: 'password',
      port: 5423,
    }),
  ],
  providers: [CoffeeRatingService],
})
export class CoffeeRatingModule {}
