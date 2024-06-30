import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Episode } from '../entities/episode.entity';

@InputType()
export class EditEpisodeInput extends PickType(Episode, [
  'title',
  'content',
  'authorComment',
]) {
  @Field(() => Number)
  episodeId: number;
}

@ObjectType()
export class EditEpisodeOutput extends CoreOutput {}
