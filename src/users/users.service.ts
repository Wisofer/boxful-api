import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, type UserDocument } from './schemas/user.schema';
import type { PublicUser } from './types/public-user.types';

function isMongoDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    err.code === 11000
  );
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  toPublic(user: UserDocument): PublicUser {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };
  }

  async create(props: {
    name: string;
    email: string;
    hashedPassword: string;
  }): Promise<PublicUser> {
    try {
      const doc = await this.userModel.create({
        name: props.name,
        email: props.email,
        password: props.hashedPassword,
      });

      return this.toPublic(doc);
    } catch (err: unknown) {
      if (isMongoDuplicateKeyError(err)) {
        throw err;
      }

      throw new InternalServerErrorException('No se pudo crear el usuario');
    }
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select('+password')
      .exec();
  }

  async findPublicById(id: string): Promise<PublicUser | null> {
    if (!this.isLikelyMongoId(id)) {
      return null;
    }

    const doc = await this.userModel.findById(id).exec();
    if (!doc) {
      return null;
    }

    return this.toPublic(doc);
  }

  private isLikelyMongoId(id: string): boolean {
    return /^[\dA-Fa-f]{24}$/.test(id.trim());
  }
}
