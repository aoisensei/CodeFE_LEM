"use client";
export const NoneUI = (params) => {
  const classroomId = Number(params.classroomId);
  if (typeof window !== "undefined") {
    localStorage.setItem("classroomId", classroomId.toString());
  }
  console.log("set classroomId: " + classroomId);
  return <></>;
};