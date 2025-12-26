import { User } from "@gpkn/shared";

declare global {
  namespace Express {
    interface User extends User {}
  }
}
