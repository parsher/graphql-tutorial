import users from "../database/users";

const context = ({req}) => {
    const token = req.headers.authorization || "";

    if (token.length != 64) return { user: null };

    const user = users.find((user)=> user.token === token);
    return {user};
};

export default context;
