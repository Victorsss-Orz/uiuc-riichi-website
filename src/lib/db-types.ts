import { RowDataPacket } from "mysql2/promise";

export interface PlayerType extends RowDataPacket {
  id: number;
  player_name: string;
}

export interface PlayerSemesterDataType extends RowDataPacket {
  player_id: number;
  semester: string;
  grade: number;
  rating: number;
  team_id: number | null;
}

export interface TeamType extends RowDataPacket {
  id: number;
  team_name: string;
  points: number;
}

export interface GameType extends RowDataPacket {
  id: number;
  game_time: string;
  is_team_game: boolean;
  semester: string;
}

enum StartingWind {
  "East",
  "South",
  "West",
  "North",
}

export interface GamePlayerType extends RowDataPacket {
  game_id: number;
  player_id: number;
  starting_wind: StartingWind | null;
  score: number;
  placement: number;
  point_change: number;
}
