import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "database", "database.json");

export const db = {
  data: {
    users: [],
  },

  load() {
    if (fs.existsSync(file)) {
      this.data = JSON.parse(fs.readFileSync(file, "utf-8"));
    }
  },

  save() {
    fs.writeFileSync(file, JSON.stringify(this.data, null, 2));
  },
};

db.load();

if (!db.data.users) {
  db.data.users = [];
}
