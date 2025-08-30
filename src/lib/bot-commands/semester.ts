import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { queryRows, queryWrite } from "../sqlDatabase.js";
import { loadSqlEquiv } from "../sqlLoader.js";
import { Semester } from "../db-types.js";

const sql = loadSqlEquiv(import.meta.url);

export const data = new SlashCommandBuilder()
  .setName("semesters")
  .setDescription("Manage semesters")
  .addSubcommand((sub) =>
    sub.setName("show").setDescription("Show the list of semesters")
  )
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Add a new semester")
      .addStringOption((opt) =>
        opt
          .setName("name")
          .setDescription("Semester name (e.g., Fall 2025)")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("use")
      .setDescription("Activate the selected semester")
      .addStringOption((opt) =>
        opt
          .setName("name")
          .setDescription("Semester name (e.g., Fall 2025)")
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();

  const semesters = await queryRows<Semester>(sql.select_semesters);
  const semestersMsg = semesters
    .map((semester) => semester.semester + (semester.active ? " (active)" : ""))
    .join("\n");
  if (sub === "show") {
    return interaction.reply({
      content: "Available semesters:\n" + semestersMsg,
    });
  }
  const semester_names = semesters.map((semester) => semester.semester);
  const name = interaction.options.getString("name", true);
  if (sub === "add") {
    if (semester_names.includes(name)) {
      return interaction.reply({ content: `Semester ${name} already exists.` });
    }
    await queryWrite(sql.insert_semester, { semester: name });
    return interaction.reply({ content: `Semester ${name} added!` });
  } else {
    if (!semester_names.includes(name)) {
      return interaction.reply({
        content: `Semester ${name} does not exist. Available semesters:\n${semestersMsg}`,
      });
    }
    await queryWrite(sql.activate_semester, { semester: name });
    return interaction.reply({ content: `Semester ${name} activated!` });
  }
}
