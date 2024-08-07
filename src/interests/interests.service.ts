import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interest, InterestableType } from './entities/interest.entity';
import { User } from 'src/users/entities/user.entity';
import {
  ToggleInterestInput,
  ToggleInterestOutput,
} from './dtos/toggle-interest.dto';
import {
  InterestSagaInput,
  InterestSagaOutput,
} from './dtos/interest-saga.dto';
import { logErrorAndReturnFalse } from 'src/utils';
import {
  InterestEpisodeInput,
  InterestEpisodeOutput,
} from './dtos/interest-episode.dto';
import { Episode } from 'src/sagas/episodes/entities/episode.entity';
import { Saga } from 'src/sagas/entities/saga.entity';
import {
  InterestSmallTalkInput,
  InterestSmallTalkOutput,
} from './dtos/interest-small-talk.dto';
import { SmallTalk } from 'src/small-talks/entities/small-talk.entity';

@Injectable()
export class InterestsService {
  constructor(
    @InjectRepository(Interest)
    private readonly interestsRepository: Repository<Interest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Episode)
    private readonly episodeRepository: Repository<Episode>,
    @InjectRepository(Saga)
    private readonly sagaRepository: Repository<Saga>,
    @InjectRepository(SmallTalk)
    private readonly smallTalkRepository: Repository<SmallTalk>,
  ) {}

  private async toggleInterest({
    userId,
    interestableId,
    interestableType,
  }: ToggleInterestInput): Promise<ToggleInterestOutput> {
    const interest = await this.interestsRepository.findOne({
      where: { user: { id: userId }, interestableId, interestableType },
    });

    if (interest) {
      await this.interestsRepository.delete(interest.id);
      return { ok: true };
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    const episode = await this.episodeRepository.findOne({
      where: { id: interestableId },
    });

    const saga = await this.sagaRepository.findOne({
      where: { id: interestableId },
    });

    const smallTalk = await this.smallTalkRepository.findOne({
      where: { id: interestableId },
    });

    const newInterest = this.interestsRepository.create({
      user,
      interestableId,
      interestableType,
      episode:
        interestableType === InterestableType['Episode'] ? episode : null,
      saga: interestableType === InterestableType['Saga'] ? saga : null,
      smallTalk:
        interestableType === InterestableType['SmallTalk'] ? smallTalk : null,
    });

    await this.interestsRepository.save(newInterest);

    return { ok: true };
  }

  async interestSaga({
    userId,
    sagaId,
  }: InterestSagaInput): Promise<InterestSagaOutput> {
    try {
      return this.toggleInterest({
        userId,
        interestableId: sagaId,
        interestableType: InterestableType.Saga,
      });
    } catch (error) {
      return logErrorAndReturnFalse(error, '시리즈 관심 작업에 실패했습니다.');
    }
  }

  async interestEpisode({
    userId,
    episodeId,
  }: InterestEpisodeInput): Promise<InterestEpisodeOutput> {
    try {
      return this.toggleInterest({
        userId,
        interestableId: episodeId,
        interestableType: InterestableType.Episode,
      });
    } catch (error) {
      return logErrorAndReturnFalse(error, '회차 관심 작업에 실패했습니다.');
    }
  }

  async interestSmallTalk({
    userId,
    smallTalkId,
  }: InterestSmallTalkInput): Promise<InterestSmallTalkOutput> {
    try {
      return this.toggleInterest({
        userId,
        interestableId: smallTalkId,
        interestableType: InterestableType.SmallTalk,
      });
    } catch (error) {
      return logErrorAndReturnFalse(error, '스몰톡 관심 작업에 실패했습니다.');
    }
  }
}
