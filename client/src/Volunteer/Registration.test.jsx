import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Registration from "./Registration";

describe("Volunteer Registration Form", () => {
  test("fills out the full form through all 4 pages", () => {
    render(
      <MemoryRouter>
        <Registration />
      </MemoryRouter>
    );

    // PAGE 1: Personal Information
    const textboxesPage1 = screen.getAllByRole("textbox"); // First Name, Last Name, Gender
    const ageInput = screen.getByRole("spinbutton");
    const ethnicitySelect = screen.getByRole("combobox");

    fireEvent.change(textboxesPage1[0], { target: { value: "Jane" } }); // First Name
    fireEvent.change(textboxesPage1[1], { target: { value: "Doe" } }); // Last Name
    fireEvent.change(textboxesPage1[2], { target: { value: "Female" } }); // Gender
    fireEvent.change(ageInput, { target: { value: "21" } }); // Age
    fireEvent.change(ethnicitySelect, {
      target: { value: "Asian or Pacific Islander" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // PAGE 2: Contact Information
    const textboxesPage2 = screen.getAllByRole("textbox"); // UAlbany Email, Personal Email, Phone
    fireEvent.change(textboxesPage2[0], { target: { value: "jdoe@albany.edu" } });
    fireEvent.change(textboxesPage2[1], { target: { value: "jane.doe@gmail.com" } });
    fireEvent.change(textboxesPage2[2], { target: { value: "1234567890" } });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // PAGE 3: Student Info
    const textboxesPage3 = screen.getAllByRole("textbox"); // UAlbany ID, Major, Minor
    const standingSelect = screen.getByRole("combobox");

    fireEvent.change(textboxesPage3[0], { target: { value: "00000000" } }); // ID
    fireEvent.change(standingSelect, { target: { value: "Senior" } });
    fireEvent.change(textboxesPage3[1], { target: { value: "Computer Science" } }); // Major
    fireEvent.change(textboxesPage3[2], { target: { value: "Math" } }); // Minor

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // PAGE 4: Registration Info
    const allSelects = screen.getAllByRole("combobox");
    const yearInput = screen.getByRole("spinbutton");
    const textboxesPage4 = screen.getAllByRole("textbox"); // Org, Supervisor Email

    fireEvent.change(allSelects[0], { target: { value: "Fall" } }); // Semester
    fireEvent.change(yearInput, { target: { value: "2025" } });
    fireEvent.change(allSelects[1], { target: { value: "RSSW190" } }); // Course
    fireEvent.change(textboxesPage4[0], { target: { value: "Albany Cares" } }); // Org
    fireEvent.change(textboxesPage4[1], { target: { value: "supervisor@org.com" } }); // Sup Email

    // Confirm final submit is there
    expect(screen.getByRole("button", { name: /Submit/i })).toBeInTheDocument();
  });
});
