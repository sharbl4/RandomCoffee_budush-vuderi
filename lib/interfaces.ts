import { Context } from "https://deno.land/x/grammy@v1.32.0/mod.ts";

export interface UserInfo {
  id: number;
  name: string;
  age: number;
  interests: string[];
  time: string;
  //image: File;
  state: string;
  rating: number;
  done: boolean;
}


export type MyContext = Context & {
  config: UserInfo;
};
