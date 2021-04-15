import { AuthenticationError, ForbiddenError } from "apollo-server";
import bcrypt from "bcrypt";
import sha256 from "crypto-js/sha256";
import rand from "csprng";
import movies from "../database/movies";
import users from "../database/users";

const resolvers = {
  Query: {
    movies: () => movies,
    movie: (_, { id }) => {
      return movies.filter(movie => movie.id === id)[0]
    },
    users: (_, __, {user}) => {
      if (!user) throw new AuthenticationError("Not Authenticated!");
      if (!user.roles.inclues("admin")) throw new ForbiddenError("Not Authorized");

      return users;
    },
    me: (_, __, {user}) => {
      if (!user) throw new AuthenticationError("Not Authenticated");

      return user;
    }
  },
  Mutation: {
    addMovie: (_, { name, rating }) => {
      // 영화 제목 중복 검사
      if (movies.find(movie => movie.name === name)) return null;
      
      // 데이터베이스에 추가
      const newMovie = {
        id: movies.length + 1,
        name,
        rating
      };
      movies.push(newMovie);
      return newMovie;
    },
    register: (_, {name, email, password}) => {
      if (users.find(user => user.email === email)) {
        return false;
      }

      bcrypt.hash(password, 10, (err, passwordHash) => {
        const newUser = {
          id: users.length + 1,
          name,
          email,
          passwordHash,
          roles: ["user"],
          token: ""
        };

        users.push(newUser);
      });

      return true;
    },
    login: (_, { email, password}) => {
      const user = users.find((user) => user.email === email);

      if (!user) return null;
      if (user.token) return null; // 이미 로그인됨
      if (!bcrypt.compareSync(password, user.passwordHash)) return null;

      user.token = sha256(rand(100, 36) + email + password).toString();

      return user;
    },
    logout: (_, __, {user})=> {
      if (!user) throw new AuthenticationError("Not Authenticated");

      user.token = "";
      return true;
    }
  }
};

export default resolvers;