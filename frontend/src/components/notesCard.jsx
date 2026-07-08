import React from "react";

const NotesCard = ({ note }) => {
  return (
    <div className="notes-card">
      <h3>{note.title}</h3>
      <p>{note.excerpt}</p>
    </div>
  );
};

export default NotesCard;
