import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data (in reverse order of dependencies)
  await prisma.messageStatus.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatRoomMember.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.friend.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing data");

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: "alice_wonder",
        email: "alice@example.com",
      },
    }),
    prisma.user.create({
      data: {
        username: "bob_builder",
        email: "bob@example.com",
      },
    }),
    prisma.user.create({
      data: {
        username: "charlie_chap",
        email: "charlie@example.com",
      },
    }),
    prisma.user.create({
      data: {
        username: "diana_dev",
        email: "diana@example.com",
      },
    }),
    prisma.user.create({
      data: {
        username: "ethan_explorer",
        email: "ethan@example.com",
      },
    }),
    prisma.user.create({
      data: {
        username: "fiona_fitness",
        email: "fiona@example.com",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create Profiles (using User IDs)
  await Promise.all([
    prisma.profile.create({
      data: {
        id: users[0].id,
        birthday: new Date("1995-03-15"),
        statusMessage: "Living my best life! 🌟",
        profilePicUrl: "https://i.pravatar.cc/150?img=1",
        backgroundPicUrl: "https://picsum.photos/seed/alice/1200/400",
      },
    }),
    prisma.profile.create({
      data: {
        id: users[1].id,
        birthday: new Date("1992-07-22"),
        statusMessage: "Can we fix it? Yes we can!",
        profilePicUrl: "https://i.pravatar.cc/150?img=2",
        backgroundPicUrl: "https://picsum.photos/seed/bob/1200/400",
      },
    }),
    prisma.profile.create({
      data: {
        id: users[2].id,
        birthday: new Date("1998-11-08"),
        statusMessage: "Coffee addict ☕",
        profilePicUrl: "https://i.pravatar.cc/150?img=3",
      },
    }),
    prisma.profile.create({
      data: {
        id: users[3].id,
        birthday: new Date("1994-05-30"),
        statusMessage: "Coding my way through life 💻",
        profilePicUrl: "https://i.pravatar.cc/150?img=4",
        backgroundPicUrl: "https://picsum.photos/seed/diana/1200/400",
      },
    }),
    prisma.profile.create({
      data: {
        id: users[4].id,
        birthday: new Date("1996-09-12"),
        statusMessage: "Adventure awaits! 🏔️",
        profilePicUrl: "https://i.pravatar.cc/150?img=5",
      },
    }),
    prisma.profile.create({
      data: {
        id: users[5].id,
        statusMessage: "No pain, no gain 💪",
        profilePicUrl: "https://i.pravatar.cc/150?img=6",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} profiles`);

  // Create Friend relationships
  const friendships = await Promise.all([
    // Alice's friends
    prisma.friend.create({
      data: { userId: users[0].id, friendId: users[1].id },
    }),
    prisma.friend.create({
      data: { userId: users[0].id, friendId: users[2].id },
    }),
    prisma.friend.create({
      data: { userId: users[0].id, friendId: users[3].id },
    }),
    // Bob's friends
    prisma.friend.create({
      data: { userId: users[1].id, friendId: users[0].id },
    }),
    prisma.friend.create({
      data: { userId: users[1].id, friendId: users[4].id },
    }),
    // Charlie's friends
    prisma.friend.create({
      data: { userId: users[2].id, friendId: users[0].id },
    }),
    prisma.friend.create({
      data: { userId: users[2].id, friendId: users[3].id },
    }),
    prisma.friend.create({
      data: { userId: users[2].id, friendId: users[5].id },
    }),
    // Diana's friends
    prisma.friend.create({
      data: { userId: users[3].id, friendId: users[0].id },
    }),
    prisma.friend.create({
      data: { userId: users[3].id, friendId: users[2].id },
    }),
    prisma.friend.create({
      data: { userId: users[3].id, friendId: users[4].id },
    }),
    // Ethan's friends
    prisma.friend.create({
      data: { userId: users[4].id, friendId: users[1].id },
    }),
    prisma.friend.create({
      data: { userId: users[4].id, friendId: users[3].id },
    }),
    // Fiona's friends
    prisma.friend.create({
      data: { userId: users[5].id, friendId: users[2].id },
    }),
  ]);

  console.log(`✅ Created ${friendships.length} friend relationships`);

  // Create Chat Rooms
  const dmRoom = await prisma.chatRoom.create({
    data: {
      roomName: "Alice & Bob",
      type: "DM",
    },
  });

  const projectRoom = await prisma.chatRoom.create({
    data: {
      roomName: "Project Team",
      type: "GROUP",
    },
  });

  const casualRoom = await prisma.chatRoom.create({
    data: {
      roomName: "Casual Hangout",
      type: "GROUP",
    },
  });

  const techTalkRoom = await prisma.chatRoom.create({
    data: {
      roomName: "Tech Talk",
      type: "GROUP",
    },
  });

  console.log("✅ Created 4 chat rooms (1 DM, 3 GROUP)");

  // Create Chat Room Members
  await Promise.all([
    // DM Room: Alice & Bob
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: dmRoom.id,
        userId: users[0].id,
        role: "MEMBER",
      },
    }),
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: dmRoom.id,
        userId: users[1].id,
        role: "MEMBER",
      },
    }),
    // Project Team: Alice (admin), Charlie, Diana, Ethan
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: projectRoom.id,
        userId: users[0].id,
        role: "ADMIN",
      },
    }),
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: projectRoom.id,
        userId: users[2].id,
        role: "MEMBER",
      },
    }),
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: projectRoom.id,
        userId: users[3].id,
        role: "MEMBER",
      },
    }),
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: projectRoom.id,
        userId: users[4].id,
        role: "MEMBER",
      },
    }),
    // Casual Hangout: All users except Ethan
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: casualRoom.id,
        userId: users[0].id,
        role: "ADMIN",
      },
    }),
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: casualRoom.id,
        userId: users[1].id,
        role: "MEMBER",
      },
    }),
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: casualRoom.id,
        userId: users[2].id,
        role: "MEMBER",
      },
    }),
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: casualRoom.id,
        userId: users[3].id,
        role: "MEMBER",
      },
    }),
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: casualRoom.id,
        userId: users[5].id,
        role: "MEMBER",
      },
    }),
    // Tech Talk: Diana (admin), Alice, Charlie, Ethan
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: techTalkRoom.id,
        userId: users[3].id,
        role: "ADMIN",
      },
    }),
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: techTalkRoom.id,
        userId: users[0].id,
        role: "MEMBER",
      },
    }),
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: techTalkRoom.id,
        userId: users[2].id,
        role: "MEMBER",
      },
    }),
    prisma.chatRoomMember.create({
      data: {
        chatRoomId: techTalkRoom.id,
        userId: users[4].id,
        role: "MEMBER",
      },
    }),
  ]);

  console.log("✅ Created chat room members");

  // Create Messages in DM Room
  const dmMessages = await Promise.all([
    prisma.message.create({
      data: {
        content: "Hey Bob! How are you doing?",
        senderId: users[0].id,
        chatRoomId: dmRoom.id,
        createdAt: new Date("2025-11-14T09:00:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "I'm great! Just finished a big project. How about you?",
        senderId: users[1].id,
        chatRoomId: dmRoom.id,
        createdAt: new Date("2025-11-14T09:05:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "Nice! I have been working on the new chat app features.",
        senderId: users[0].id,
        chatRoomId: dmRoom.id,
        createdAt: new Date("2025-11-14T09:10:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "Sounds exciting! Need any help with it?",
        senderId: users[1].id,
        chatRoomId: dmRoom.id,
        createdAt: new Date("2025-11-14T09:12:00Z"),
      },
    }),
  ]);

  // Create Messages in Project Team
  const projectMessages = await Promise.all([
    prisma.message.create({
      data: {
        content: "Team meeting at 2 PM today. Please be there!",
        senderId: users[0].id,
        chatRoomId: projectRoom.id,
        createdAt: new Date("2025-11-15T08:00:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "Got it! What is on the agenda?",
        senderId: users[2].id,
        chatRoomId: projectRoom.id,
        createdAt: new Date("2025-11-15T08:15:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "We will discuss the database schema and API endpoints.",
        senderId: users[0].id,
        chatRoomId: projectRoom.id,
        createdAt: new Date("2025-11-15T08:20:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "I'll prepare the backend documentation.",
        senderId: users[3].id,
        chatRoomId: projectRoom.id,
        createdAt: new Date("2025-11-15T08:25:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "Perfect! Looking forward to it.",
        senderId: users[4].id,
        chatRoomId: projectRoom.id,
        createdAt: new Date("2025-11-15T08:30:00Z"),
      },
    }),
  ]);

  // Create Messages in Casual Hangout
  const casualMessages = await Promise.all([
    prisma.message.create({
      data: {
        content: "Anyone up for coffee this afternoon?",
        senderId: users[2].id,
        chatRoomId: casualRoom.id,
        createdAt: new Date("2025-11-15T10:00:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "I'm in! Where are we meeting?",
        senderId: users[1].id,
        chatRoomId: casualRoom.id,
        createdAt: new Date("2025-11-15T10:05:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "How about the new cafe downtown?",
        senderId: users[2].id,
        chatRoomId: casualRoom.id,
        createdAt: new Date("2025-11-15T10:08:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "Sounds good! See you at 3 PM?",
        senderId: users[5].id,
        chatRoomId: casualRoom.id,
        createdAt: new Date("2025-11-15T10:10:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "Perfect! 👍",
        senderId: users[0].id,
        chatRoomId: casualRoom.id,
        createdAt: new Date("2025-11-15T10:12:00Z"),
      },
    }),
  ]);

  // Create Messages in Tech Talk
  const techMessages = await Promise.all([
    prisma.message.create({
      data: {
        content: "Has anyone tried the new Prisma 6 features?",
        senderId: users[3].id,
        chatRoomId: techTalkRoom.id,
        createdAt: new Date("2025-11-14T14:00:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "Yes! The strict undefined checks are really helpful.",
        senderId: users[0].id,
        chatRoomId: techTalkRoom.id,
        createdAt: new Date("2025-11-14T14:10:00Z"),
      },
    }),
    prisma.message.create({
      data: {
        content: "I love the improved TypeScript support!",
        senderId: users[2].id,
        chatRoomId: techTalkRoom.id,
        createdAt: new Date("2025-11-14T14:15:00Z"),
      },
    }),
  ]);

  const allMessages = [
    ...dmMessages,
    ...projectMessages,
    ...casualMessages,
    ...techMessages,
  ];

  console.log(`✅ Created ${allMessages.length} messages across all rooms`);

  // Create Message Status for all messages
  // Get all room members for each message
  const messageStatuses = [];

  // DM Room message statuses
  for (const message of dmMessages) {
    const members = [users[0].id, users[1].id];
    for (const userId of members) {
      if (userId !== message.senderId) {
        messageStatuses.push(
          prisma.messageStatus.create({
            data: {
              messageId: message.id,
              userId: userId,
              isRead: Math.random() > 0.3, // 70% read
            },
          })
        );
      }
    }
  }

  // Project Room message statuses
  const projectMembers = [users[0].id, users[2].id, users[3].id, users[4].id];
  for (const message of projectMessages) {
    for (const userId of projectMembers) {
      if (userId !== message.senderId) {
        messageStatuses.push(
          prisma.messageStatus.create({
            data: {
              messageId: message.id,
              userId: userId,
              isRead: Math.random() > 0.4, // 60% read
            },
          })
        );
      }
    }
  }

  // Casual Room message statuses
  const casualMembers = [
    users[0].id,
    users[1].id,
    users[2].id,
    users[3].id,
    users[5].id,
  ];
  for (const message of casualMessages) {
    for (const userId of casualMembers) {
      if (userId !== message.senderId) {
        messageStatuses.push(
          prisma.messageStatus.create({
            data: {
              messageId: message.id,
              userId: userId,
              isRead: Math.random() > 0.5, // 50% read
            },
          })
        );
      }
    }
  }

  // Tech Talk message statuses
  const techMembers = [users[3].id, users[0].id, users[2].id, users[4].id];
  for (const message of techMessages) {
    for (const userId of techMembers) {
      if (userId !== message.senderId) {
        messageStatuses.push(
          prisma.messageStatus.create({
            data: {
              messageId: message.id,
              userId: userId,
              isRead: Math.random() > 0.2, // 80% read
            },
          })
        );
      }
    }
  }

  await Promise.all(messageStatuses);

  console.log(`✅ Created ${messageStatuses.length} message status records`);

  console.log("\n🎉 Database seed completed successfully!\n");
  console.log("📊 Summary:");
  console.log(`   - ${users.length} users with profiles`);
  console.log(`   - ${friendships.length} friend relationships`);
  console.log("   - 4 chat rooms (1 DM, 3 GROUP)");
  console.log(`   - ${allMessages.length} messages`);
  console.log(`   - ${messageStatuses.length} message read statuses`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
