import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AddHours from "./AddHours";

// Mock fetches
beforeEach(() => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        loggedIn: true,
        user: { email: "volunteer@albany.edu" },
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { class_name: "RSSW190", class_description: "Service Learning" },
      ],
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        supervisor_email: "supervisor@albany.edu",
      }),
    });
});

test("renders and accepts input in all fields", async () => {
  const { container } = render(
    <MemoryRouter>
      <AddHours />
    </MemoryRouter>
  );

  
  // Wait for form to load
  await waitFor(() =>
    expect(screen.getByText(/Submit Hours Request/i)).toBeInTheDocument()
  );
  // Select class
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "RSSW190" },
  });

  // Date input
  fireEvent.change(screen.getByPlaceholderText("MM/DD"), {
    target: { value: "04/15" },
  });

  // Target inputs by name using container.querySelector
  const fromInput = container.querySelector('input[name="from"]');
  const toInput = container.querySelector('input[name="to"]');
  fireEvent.change(fromInput, { target: { value: "10:00" } });
  fireEvent.change(toInput, { target: { value: "12:00" } });

  // Activity textarea
  fireEvent.change(screen.getByPlaceholderText("Describe the activity"), {
    target: { value: "Tutored students at the library" },
  });

  // Check that submit is present
  expect(screen.getByRole("button", { name: /Submit Request/i })).toBeInTheDocument();
});
