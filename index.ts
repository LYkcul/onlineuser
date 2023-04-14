import { Handler, db } from 'hydrooj';

const token: Collection<Token> = db.collection('token');
const user: Collection<Token> = db.collection('user');

interface Token {
  _id: string;
  uid: number;
  updateAt: Date;
}

interface User {
  _id: string;
  uname: string;
}

interface UserToken {
  uid: number;
  uname: string;
}

async function getUserTokens(): Promise<UserToken[]> {
  const result = await token.aggregate<Token>([
    { $match: { updateAt: { $gte: new Date(Date.now() - 1800 * 1000) }, uid: { $gt: 1 } } },
    { $group: { _id: '$uid' } },
    { $lookup: { from: 'user', localField: '_id', foreignField: '_id', as: 'user' } },
    { $project: { _id: '$_id', uname: '$user.uname' } },
    { $unwind: '$uname' },
  ]).toArray();
  const res: UserToken[] = result.map((item) => ({ uid: item._id, uname: item.uname }));
  return res;
}

class OnlineUserHandler extends Handler {
    async get() {
        const onlineusers = await getUserTokens();
        this.response.body = { onlineusers };
        this.response.template = 'online_user.html';
    }
}

export async function apply(ctx: Context) {
    ctx.Route('online_user', '/onlineuser', OnlineUserHandler);
}
