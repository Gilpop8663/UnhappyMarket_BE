import { Injectable } from '@nestjs/common';
import { SmallTalk } from './entities/small-talk.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateSmallTalkInput,
  CreateSmallTalkOutput,
} from './dtos/create-small-talk.dto';
import { logErrorAndReturnFalse } from 'src/utils';
import { User } from 'src/users/entities/user.entity';
import {
  EditSmallTalkInput,
  EditSmallTalkOutput,
} from './dtos/edit-small-talk.dto';
import {
  DeleteSmallTalkInput,
  DeleteSmallTalkOutput,
} from './dtos/delete-small-talk.dto';
import {
  GetSmallTalkDetailInput,
  GetSmallTalkDetailOutput,
} from './dtos/get-small-talk-detail.dto';
import {
  GetSmallTalkListInput,
  GetSmallTalkListOutput,
} from './dtos/get-small-talk-list.dto';
import { PurchaseService } from 'src/purchase/purchase.service';
import { ViewLogsService } from 'src/view-logs/view-logs.service';

@Injectable()
export class SmallTalksService {
  constructor(
    @InjectRepository(SmallTalk)
    private smallTalkRepository: Repository<SmallTalk>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly purchaseService: PurchaseService,
    private readonly viewLogService: ViewLogsService,
  ) {}

  async createSmallTalk({
    title,
    authorComment,
    content,
    point,
    thumbnailUrl,
    userId,
  }: CreateSmallTalkInput): Promise<CreateSmallTalkOutput> {
    try {
      const author = await this.userRepository.findOne({
        where: { id: userId },
      });

      const smallTalk = this.smallTalkRepository.create({
        content,
        authorComment,
        title,
        point,
        thumbnailUrl,
        author,
      });

      await this.smallTalkRepository.save(smallTalk);

      return { ok: true, smallTalkId: smallTalk.id };
    } catch (error) {
      return logErrorAndReturnFalse(error, '스몰톡 생성에 실패했습니다.');
    }
  }

  async editSmallTalk({
    smallTalkId,
    title,
    content,
    authorComment,
    thumbnailUrl,
    point,
  }: EditSmallTalkInput): Promise<EditSmallTalkOutput> {
    try {
      await this.smallTalkRepository.update(smallTalkId, {
        title,
        content,
        authorComment,
        thumbnailUrl,
        point,
      });

      return { ok: true };
    } catch (error) {
      return logErrorAndReturnFalse(error, '스몰톡 수정에 실패했습니다.');
    }
  }

  async deleteSmallTalk({
    smallTalkId,
  }: DeleteSmallTalkInput): Promise<DeleteSmallTalkOutput> {
    try {
      await this.smallTalkRepository.delete(smallTalkId);

      return { ok: true };
    } catch (error) {
      return logErrorAndReturnFalse(error, '스몰톡 삭제에 실패했습니다.');
    }
  }

  async getSmallTalkList({
    userId,
  }: GetSmallTalkListInput): Promise<GetSmallTalkListOutput> {
    try {
      const smallTalkList = await this.smallTalkRepository.find({
        relations: ['interests', 'likes', 'author', 'comments', 'viewLogs'],
      });

      const purchasedSmallTalkIdList = userId
        ? await this.purchaseService.findPurchasedSmallTalkList(userId)
        : [];

      const viewLogSmallTalkIdList = userId
        ? await this.viewLogService.getSmallTalkIdsByUserViewLogs(userId)
        : [];

      return {
        ok: true,
        data: smallTalkList.map((smallTalk) => ({
          ...smallTalk,
          isPurchased: purchasedSmallTalkIdList.includes(smallTalk.id),
          isViewed: viewLogSmallTalkIdList.includes(smallTalk.id),
          views: smallTalk.viewLogs.length,
        })),
      };
    } catch (error) {
      return logErrorAndReturnFalse(error, '스몰톡 목록 조회에 실패했습니다.');
    }
  }

  async getSmallTalkDetail({
    smallTalkId,
    userId,
  }: GetSmallTalkDetailInput): Promise<GetSmallTalkDetailOutput> {
    try {
      const smallTalk = await this.smallTalkRepository.findOne({
        where: { id: smallTalkId },
        relations: ['interests', 'likes', 'author', 'comments', 'viewLogs'],
      });

      if (userId) {
        await this.viewLogService.createSmallTalkViewLog({
          smallTalkId,
          userId,
        });
      }

      const purchasedSmallTalkIdList = userId
        ? await this.purchaseService.findPurchasedSmallTalkList(userId)
        : [];

      return {
        ok: true,
        data: {
          ...smallTalk,
          isPurchased: purchasedSmallTalkIdList.includes(smallTalk.id),
          views: smallTalk.viewLogs.length,
        },
      };
    } catch (error) {
      return logErrorAndReturnFalse(error, '스몰톡 상세 조회에 실패했습니다.');
    }
  }
}
