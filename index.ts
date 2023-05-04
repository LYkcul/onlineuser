import { definePlugin, Handler, db, Context, avatar } from 'hydrooj';

const token: Collection<Token> = db.collection('token');
const user: Collection<User> = db.collection('user');

interface Token {
  _id: string;
  uid: number;
  updateAt: Date;
  uname: string;
  avatar: string;
}

interface User {
  _id: number;
  uname: string;
  avatar: string;
}

interface UserToken {
  uid: number;
  uname: string;
  avatar: string;
  avatarUrl: string;
}


async function getUserTokens(): Promise<UserToken[]> {
  const result = await token.aggregate<Token>([
    { $match: { updateAt: { $gte: new Date(Date.now() - 900 * 1000) }, uid: { $gt: 1 } } },
    { $group: { _id: '$uid' } },
    { $lookup: { from: 'user', localField: '_id', foreignField: '_id', as: 'user' } },
    { $project: { _id: '$_id', uname: '$user.uname', avatar: '$user.avatar' } },
    { $unwind: '$uname' },
  ]).toArray();
    const res: UserToken[] = result.map((item) => ({
    uid: item._id,
    uname: item.uname,
    avatar: item.avatar,
    avatarUrl: avatar(item.avatar, 20),
    }));
  return res;
}

class OnlineUserHandler extends Handler {
    async get() {
        const onlineusers = await getUserTokens();
        this.response.body = { onlineusers };
        this.response.template = 'onlineuser.html';
    }
}

export default definePlugin({
    apply(ctx) {    
	  ctx.Route('onlineusers', '/onlineuser', OnlineUserHandler);
    }
});
