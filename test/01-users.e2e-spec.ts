import * as request from 'supertest';
import { app, usersRepository } from './jest.setup';

const GRAPHQL_ENDPOINT = '/graphql';

const TEST_USER = {
  username: 'asdfqwer',
  email: 'asdf1234@naver.com',
  password: '12341234',
  nickname: '우드',
};

describe('AppController (e2e)', () => {
  beforeAll(async () => {
    const createUser = ({ email, nickname, password, username }) => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: /* GraphQL */ `
          mutation {
            createAccount(
              input: { email: "${email}",
               nickname: "${nickname}",
                password: "${password}", 
                username: "${username}" }
            ) {
              ok
              error
            }
          }
        `,
        });
    };

    for (let index = 0; index < 5; index++) {
      await createUser({
        email: index,
        nickname: index,
        password: index,
        username: index,
      });
    }

    await usersRepository.update(1, { point: 3000 });
    await usersRepository.update(2, { point: 3000 });
  });

  describe('아이디 생성', () => {
    test('아이디를 생성한다.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: /* GraphQL */ `
            mutation {
              createAccount(
                input: { email: "${TEST_USER.email}",
                 nickname: "${TEST_USER.nickname}",
                  password: "${TEST_USER.password}", 
                  username: "${TEST_USER.username}" }
              ) {
                ok
                error
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;

          expect(createAccount.ok).toBe(true);
          expect(createAccount.error).toBe(null);
        });
    });

    test('중복된 아이디를 입력했을 때 생성되지 않는다.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: /* GraphQL */ `
            mutation {
              createAccount(
                input: { email: "asdhh@naver.com",
                 nickname: "바람",
                  password: "${TEST_USER.password}", 
                  username: "${TEST_USER.username}" }
              ) {
                ok
                error
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;

          expect(createAccount.ok).toBe(false);
          expect(createAccount.error).toBe('이미 존재하는 아이디입니다.');
        });
    });

    test('중복된 이메일을 입력했을 때 생성되지 않는다.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: /* GraphQL */ `
            mutation {
              createAccount(
                input: { email: "${TEST_USER.email}",
                 nickname: "test닉네임",
                  password: "${TEST_USER.password}", 
                  username: "필명" }
              ) {
                ok
                error
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;

          expect(createAccount.ok).toBe(false);
          expect(createAccount.error).toBe('이미 존재하는 이메일입니다.');
        });
    });

    test('중복된 닉네임을 입력했을 때 생성되지 않는다.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: /* GraphQL */ `
            mutation {
              createAccount(
                input: { email: "ggee@naver.com",
                 nickname: "${TEST_USER.nickname}",
                  password: "${TEST_USER.password}", 
                  username: "getTO" }
              ) {
                ok
                error
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;

          expect(createAccount.ok).toBe(false);
          expect(createAccount.error).toBe('이미 존재하는 닉네임입니다.');
        });
    });
  });

  describe('로그인', () => {
    test('로그인한다 ', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: /* GraphQL */ `
          mutation {
            login(input: { password: "${TEST_USER.password}", username: "${TEST_USER.username}" }) {
              ok
              error
              token
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;

          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
        });
    });

    test('잘못된 비밀번호로 로그인을 시도한다.', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: /* GraphQL */ `
          mutation {
            login(input: { password: "test", username: "${TEST_USER.username}" }) {
              ok
              error
              token
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;

          expect(login.ok).toBe(false);
          expect(login.error).toBe('비밀번호가 맞지 않습니다.');
          expect(login.token).toEqual(null);
        });
    });
  });

  test(`유저 정보를 조회했을 때 아이디, 포인트, 내이야기, 닉네임, 
    이메일, 댓글, 관심 이야기, 좋아요를 누른 작품이나 회차를 알 수 있다.`, async () => {
    const [initialUser] = await usersRepository.find({
      relations: ['interests', 'likes', 'sagas', 'comments'],
    });

    const requiredKeys = [
      'id',
      'username',
      'createdAt',
      'updatedAt',
      'email',
      'point',
      'nickname',
      'sagas',
      'likes',
      'interests',
      'comments',
    ];

    expect(initialUser).toEqual(expect.any(Object));

    requiredKeys.forEach((key) => {
      expect(initialUser).toHaveProperty(key);
    });
  });
});

test.each([
  [`${TEST_USER.username}tes`, true],
  [TEST_USER.username, false],
])(
  '아이디: %s를 중복 확인 한다. 중복 확인에 결과는 %s를 반환한다.',
  (username, result) => {
    return request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .send({
        query: /* GraphQL */ `
      mutation {
        checkUsername(input: { username: "${username}" }) {
          ok
          error
        }
      }
    `,
      })
      .expect(200)
      .expect((res) => {
        const {
          body: {
            data: { checkUsername },
          },
        } = res;

        expect(checkUsername.ok).toBe(result);
        expect(checkUsername.error).toBe(null);
      });
  },
);

test.each([
  [`${TEST_USER.nickname}tes`, true],
  [TEST_USER.nickname, false],
])(
  '닉네임: %s를 중복 확인 한다. 중복 확인에 결과는 %s를 반환한다.',
  (nickname, result) => {
    return request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .send({
        query: /* GraphQL */ `
      mutation {
        checkNickname(input: { nickname: "${nickname}" }) {
          ok
          error
        }
      }
    `,
      })
      .expect(200)
      .expect((res) => {
        const {
          body: {
            data: { checkNickname },
          },
        } = res;

        expect(checkNickname.ok).toBe(result);
        expect(checkNickname.error).toBe(null);
      });
  },
);

test.each([
  [`asd${TEST_USER.email}`, true],
  [TEST_USER.email, false],
])(
  '이메일: %s를 중복 확인 한다. 중복 확인에 결과는 %s를 반환한다.',
  (email, result) => {
    return request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .send({
        query: /* GraphQL */ `
      mutation {
        checkEmail(input: { email: "${email}" }) {
          ok
          error
        }
      }
    `,
      })
      .expect(200)
      .expect((res) => {
        const {
          body: {
            data: { checkEmail },
          },
        } = res;

        expect(checkEmail.ok).toBe(result);
        expect(checkEmail.error).toBe(null);
      });
  },
);

test.todo('아이디 찾기를 한다. 이메일로 아이디를 보내준다.');

test.todo(
  '비밀번호 찾기를 한다. 이메일로 토큰이 담긴 링크를 보내 재설정할 수 있도록 한다.',
);
