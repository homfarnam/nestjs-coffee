import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Event } from 'src/events/entities/event.entity';
import { Connection, Repository } from 'typeorm';
import { COFFEE_BRANDS } from './coffees.constants';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { Coffee } from './entities/coffee.entity';
import { Flavor } from './entities/flavor.entity';

@Injectable({ scope: Scope.REQUEST })
export class CoffeesService {
  constructor(
    @InjectRepository(Coffee)
    private readonly coffeRepository: Repository<Coffee>,

    @InjectRepository(Flavor)
    private readonly flavorRepository: Repository<Flavor>,

    private readonly connection: Connection,

    @Inject(COFFEE_BRANDS) coffeeBrands: string[],
  ) {
    console.log('coffee service instantiated!');
  }

  findAll(paginationQuery: PaginationQueryDto) {
    const { limit, offset } = paginationQuery;
    return this.coffeRepository.find({
      relations: ['flavors'],
      skip: offset,
      take: limit,
    });
  }

  async findOne(id: string) {
    // const coffee = this.coffees.find((item) => item.id === +id);
    const coffee = await this.coffeRepository.findOne(id, {
      relations: ['flavors'],
    });
    if (!coffee) {
      throw new NotFoundException(`Coffee #${id} not found`);
    }
    return coffee;
  }

  async create(createCoffeeDto: CreateCoffeeDto) {
    // this.coffees.push(createCoffeeDto);
    // return createCoffeeDto;
    const flavors = await Promise.all(
      createCoffeeDto.flavors.map((name) => this.preloadFlavorByName(name)),
    );

    const coffee = this.coffeRepository.create({ ...createCoffeeDto, flavors });
    return this.coffeRepository.save(coffee);
  }

  async update(id: string, updateCoffeeDto: any) {
    // const existingCoffee = this.findOne(id);
    const flavors =
      updateCoffeeDto.flavors &&
      (await Promise.all(
        updateCoffeeDto.flavors.map((name) => this.preloadFlavorByName(name)),
      ));

    const coffee = await this.coffeRepository.preload({
      id: +id,
      ...updateCoffeeDto,
      flavors,
    });
    if (!coffee) {
      throw new NotFoundException(`Coffee #${id} not found!`);
    }
    return this.coffeRepository.save(coffee);
  }

  async remove(id: string) {
    // const coffeeIndex = this.coffees.findIndex((item) => item.id === +id);
    // if (coffeeIndex >= 0) {
    //   this.coffees.splice(coffeeIndex, 1);
    // }

    const coffee = await this.findOne(id);
    return this.coffeRepository.remove(coffee);
  }

  async recommendCoffee(coffee: Coffee) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      coffee.recommendations++;

      const recommendEvent = new Event();
      recommendEvent.name = 'recommend_coffee';
      recommendEvent.type = 'coffee';
      recommendEvent.payload = { coffeeId: coffee.id };

      await queryRunner.manager.save(coffee);
      await queryRunner.manager.save(recommendEvent);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  private async preloadFlavorByName(name: string): Promise<Flavor> {
    const existingFlavor = await this.flavorRepository.findOne({ name });
    if (existingFlavor) {
      return existingFlavor;
    }
    return this.flavorRepository.create({ name });
  }
}
