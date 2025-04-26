import { RowDataPacket } from "mysql2/promise";

export interface PlayerType extends RowDataPacket {
  id: number;
  player_name: string;
}

export interface PlayerSemesterDataType extends RowDataPacket {
  player_id: number;
  semester: string;
  ranking: number; // 段位
  points: number; // pt
  team_id: number | null;
}

export type Team = {
  id: number;
  team_name: string;
  points: number;
  semester: string;
};
export interface TeamRow extends Team, RowDataPacket {}

export type Game = {
  id: number;
  game_time: string;
  is_team_game: boolean;
  semester: string; // TODO: add rule
};
export interface GameRow extends Game, RowDataPacket {}

export enum StartingWind {
  "East",
  "South",
  "West",
  "North",
}

export type GamePlayer = {
  game_id: number;
  player_id: number;
  starting_wind: StartingWind | null;
  score: number;
  placement: number;
  point_change: number;
};
export interface GamePlayerRow extends GamePlayer, RowDataPacket {}

export interface SemesterType extends RowDataPacket {
  semester: string;
}
