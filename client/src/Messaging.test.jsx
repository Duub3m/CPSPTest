import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Messaging from "./Messaging";
import { MemoryRouter } from "react-router-dom";

beforeEach(() => {
  jest.clearAllMocks();

  global.fetch = jest.fn((url) => {
    if (url.includes("/auth/logged_in")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          loggedIn: true,
          user: {
            email: "test@albany.edu",
            first_name: "Test",
            last_name: "User",
          },
        }),
      });
    }

    if (url.includes("/api/users/")) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          {
            email: "other@albany.edu",
            first_name: "Other",
            last_name: "Person",
            organization_name: "Org",
            role: "Supervisor",
          },
        ],
      });
    }

    if (url.includes("/api/messages/test@albany.edu/other@albany.edu")) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          {
            id: 1,
            sender_email: "other@albany.edu",
            receiver_email: "test@albany.edu",
            message: "Hey there!",
            created_at: new Date().toISOString(),
          },
        ],
      });
    }

    if (url.includes("/api/messages") && !url.includes("/test@albany.edu/")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: 2 }),
      });
    }

    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  });
});

test("loads messaging UI and sends a message", async () => {
  render(
    <MemoryRouter>
      <Messaging />
    </MemoryRouter>
  );
  // Wait for Contacts to render
  await waitFor(() => expect(screen.getByText(/Contacts/i)).toBeInTheDocument());
  await waitFor(() => expect(screen.getByText(/Other Person/i)).toBeInTheDocument());

  fireEvent.click(screen.getByText(/Other Person/i));

  await waitFor(() =>
    expect(screen.getByText(/Conversation with Other Person/i)).toBeInTheDocument()
  );

  const messageInput = screen.getByPlaceholderText("Type a message...");
  fireEvent.change(messageInput, { target: { value: "Hello!" } });

  fireEvent.click(screen.getByText("Send"));

  
  await waitFor(() => expect(screen.getByText("Hello!")).toBeInTheDocument());
});
