document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Add participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";
        participantsDiv.appendChild(participantsTitle);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (details.participants.length === 0) {
          const li = document.createElement("li");
          li.className = "no-participants";
          li.textContent = "No participants yet.";
          participantsList.appendChild(li);
        } else {
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const badge = document.createElement("span");
            badge.className = "participant-badge";
            badge.textContent = email; // safe via textContent

            li.appendChild(badge);
            participantsList.appendChild(li);
          });
        }

        participantsDiv.appendChild(participantsList);
        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Update the UI immediately without a full refresh
        const activityCard = Array.from(activitiesList.querySelectorAll('.activity-card'))
          .find(card => card.querySelector('h4') && card.querySelector('h4').textContent === activity);

        if (activityCard) {
          const participantsList = activityCard.querySelector('.participants-list');
          if (participantsList) {
            // remove placeholder if present
            const placeholder = participantsList.querySelector('.no-participants');
            if (placeholder) placeholder.remove();

            // create new participant item
            const li = document.createElement('li');
            li.className = 'participant-item';

            const badge = document.createElement('span');
            badge.className = 'participant-badge';
            badge.textContent = email; // safe via textContent

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.setAttribute('aria-label', `Remove ${email}`);
            deleteBtn.title = `Unregister ${email} from ${activity}`;
            deleteBtn.textContent = '\u{1F5D1}'; // trash can emoji

            deleteBtn.addEventListener('click', async () => {
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );

                const data = await resp.json();

                if (resp.ok) {
                  li.remove();

                  const remaining = participantsList.querySelectorAll('.participant-item').length;
                  if (remaining === 0) {
                    const ph = document.createElement('li');
                    ph.className = 'no-participants';
                    ph.textContent = 'No participants yet.';
                    participantsList.appendChild(ph);
                  }

                  const availability = activityCard.querySelector('.availability');
                  if (availability) {
                    const current = parseInt(availability.textContent, 10) || 0;
                    availability.textContent = current + 1;
                  }

                  messageDiv.textContent = data.message;
                  messageDiv.className = 'success';
                } else {
                  messageDiv.textContent = data.detail || 'Failed to remove participant';
                  messageDiv.className = 'error';
                }

                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 5000);
              } catch (err) {
                messageDiv.textContent = 'Failed to remove participant. Please try again.';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
                console.error('Error removing participant:', err);
              }
            });

            li.appendChild(badge);
            li.appendChild(deleteBtn);
            participantsList.appendChild(li);

            // Update availability count
            const availability = activityCard.querySelector('.availability');
            if (availability) {
              const current = parseInt(availability.textContent, 10) || 0;
              availability.textContent = Math.max(0, current - 1);
            }
          }
        }

        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
