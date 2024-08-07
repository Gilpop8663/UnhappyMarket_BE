import { Test, TestingModule } from '@nestjs/testing';
import { EpisodesResolver } from './episodes.resolver';

describe('EpisodesResolver', () => {
  let resolver: EpisodesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EpisodesResolver],
    }).compile();

    resolver = module.get<EpisodesResolver>(EpisodesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
