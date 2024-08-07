import { InputType, registerEnumType } from '@nestjs/graphql';
import { Field, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Episode } from 'src/sagas/episodes/entities/episode.entity';
import { IsEnum } from 'class-validator';
import { Saga } from 'src/sagas/entities/saga.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { SmallTalk } from 'src/small-talks/entities/small-talk.entity';

export enum LikeableType {
  Saga,
  Episode,
  Comment,
  SmallTalk,
}

registerEnumType(LikeableType, {
  name: 'LikeableType',
});

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Like extends CoreEntity {
  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @Field(() => User)
  user: User;

  @Column()
  @Field(() => Number)
  likeableId: number;

  @Column({ type: 'enum', enum: LikeableType })
  @Field(() => LikeableType)
  @IsEnum(LikeableType)
  likeableType: LikeableType;

  @ManyToOne(() => Episode, (episode) => episode.likes, { nullable: true })
  @Field(() => Episode, { nullable: true })
  episode?: Episode;

  @ManyToOne(() => Saga, (saga) => saga.likes, { nullable: true })
  @Field(() => Saga, { nullable: true })
  saga?: Saga;

  @ManyToOne(() => Comment, (comment) => comment.likes, { nullable: true })
  @Field(() => Comment, { nullable: true })
  comment?: Comment;

  @ManyToOne(() => SmallTalk, (smallTalk) => smallTalk.likes, {
    nullable: true,
  })
  @Field(() => SmallTalk, { nullable: true })
  smallTalk?: SmallTalk;
}
