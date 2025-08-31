export type Player = { id: string; player_name: string };

export type PlayerSemesterData = {
  player_id: string;
  semester: string;
  ranking: number; // 段位
  points: number; // pt
  team_id: number | null;
};

export type Team = {
  id: number;
  team_name: string;
  points: number;
  semester: string;
};

export type Game = {
  id: number;
  game_time: string;
  is_team_game: boolean;
  semester: string; // TODO: add rule
};

export enum StartingWind {
  "East",
  "South",
  "West",
  "North",
}

export type GamePlayer = {
  game_id: number;
  player_id: string;
  starting_wind: StartingWind | null;
  score: number;
  placement: number;
  point_change: number;
};

export type Semester = { semester: string; active: boolean };
