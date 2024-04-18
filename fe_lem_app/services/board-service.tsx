import { Board } from "@/models/board";
import { Card } from "@/models/card";
import { NextResponse } from "next/server";

const DATA_SOURCE_URL = process.env.BASE_URL + "/lem/board/";

export async function ListBoard() {
  try {
    const res = await fetch(DATA_SOURCE_URL + "list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const Boards: Board[] = await res.json();
    return Boards;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

export async function ListCard() {
  try {
    const res = await fetch(DATA_SOURCE_URL + "list-card-by-userId", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const Cards: Card[] = await res.json();
    return Cards;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

export async function GetBoard(id: number) {
  try {
    const res = await fetch(DATA_SOURCE_URL + "get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    const Boards: Board = await res.json();
    return Boards;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

export async function GetOwnBoard(userId: number) {
  try {
    const res = await fetch(DATA_SOURCE_URL + "get-own", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appUserId: userId }),
    });
    const board = await res.json();
    return board;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

export async function ListByClassroom(classroomId: number) {
  try {
    const res = await fetch(DATA_SOURCE_URL + "list-by-classroom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ classroomId: classroomId }),
    });
    const boards = await res.json();
    return boards;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

export async function CreateBoard(board: any) {
  try {
    const res = await fetch(DATA_SOURCE_URL + "create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: board.name,
        imageUrl: board.imageUrl,
        appUserBoardMappings: board.appUserBoardMappings,
        classroomId: board.classroomId,
      }),
    });

    const newBoard = await res.json();
    return newBoard; // Return the created board if successful
  } catch (error) {
    // Handle network errors or unexpected exceptions
    console.error("Error creating board:", error);
    return { error: "An unexpected error occurred." }; // Return a generic error message
  }
}

export async function UpdateBoard(board: Board) {
  const res = await fetch(DATA_SOURCE_URL + "update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: board.id,
      code: board.code,
      name: board.name,
      description: board.description,
      isFavourite: board.isFavourite,
      imageUrl: board.imageUrl,
      classroomId: board.classroomId,
      appUserBoardMappings: board.appUserBoardMappings,
      cards: board.cards,
    }),
  });
  const newBoard: Board = await res.json();
  return newBoard;
}

export async function DeleteBoard(request: Request) {
  const { id }: Partial<Board> = await request.json();

  if (!id) return NextResponse.json({ message: "Board id required" });

  await fetch(DATA_SOURCE_URL + "delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return id;
}
