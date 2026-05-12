// db/schema.ts
import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  uuid,
  integer,
  text,
  index,
} from "drizzle-orm/pg-core";

export const familyMembers = pgTable("family_members", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomCode: varchar("room_code", { length: 10 }).unique().notNull(),
    hostId: text("host_id").notNull(),
    roomName: varchar("room_name", { length: 100 }),
    currentVideoUrl: text("current_video_url"),
    videoType: varchar("video_type", { length: 20 }),
    videoId: varchar("video_id", { length: 100 }),
    isPlaying: boolean("is_playing").default(false),
    videoTime: integer("video_time").default(0),
    volume: integer("volume").default(100),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    roomCodeIdx: index("room_code_idx").on(table.roomCode),
  }),
);

export const watchSessions = pgTable("watch_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }),
  memberId: text("member_id").references(() => familyMembers.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  lastSyncTime: integer("last_sync_time").default(0),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }),
  memberId: text("member_id"),
  memberName: text("member_name"),
  memberImage: text("member_image"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});
