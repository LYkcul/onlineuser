import { definePlugin, Handler, db, Context, avatar, UserModel } from 'hydrooj';

const token: Collection<Token> = db.collection('token');
const user: Collection<User> = db.collection('user');

interface Token {
  _id: string;
  uid: number;
  updateAt: Date;
  uname: string;
  avatar: string;
  bio: any;
}

interface User {
  _id: number;
  uname: string;
  avatar: string;
  bio: any;
}

interface UserToken {
  uid: number;
  uname: string;
  avatar: string;
  avatarUrl: string;
  bio: any;
  udoc;
}


async function getUserTokens(): Promise<UserToken[]> {
  const result = await token.aggregate<Token>([
    { $match: { updateAt: { $gte: new Date(Date.now() - 900 * 1000) }, uid: { $gt: 1 } } },
    { $group: { _id: '$uid' } },
    { $lookup: { from: 'user', localField: '_id', foreignField: '_id', as: 'user' } },
    { $project: { _id: '$_id', uname: '$user.uname', avatar: '$user.avatar', bio: '$user.bio' } },
    { $unwind: '$uname' },
  ]).toArray();
  let res = result.map((item) => ({
    uid: item._id,
    uname: item.uname,
    avatar: item.avatar,
    bio: String(item.bio),
  }));
  for (const node of res) {
      //const udocs = UserModel.getById(String("system"), node.uid);
      //node.udoc = udocs;
      const avatarUrl = avatar(String(node.avatar), 20);
      node.avatarUrl = avatarUrl;
      //console.log(node.avatar);
      //console.log(avatarUrl);
  }
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
