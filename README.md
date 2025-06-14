# 🚀 RepoScape: A 3D GitHub Repository Explorer

**RepoScape** transforms the entire history of a software repository into a stunning, interactive 3D city that you can explore. Watch the project's development unfold before your eyes in a cinematic "time machine" animation, revealing the story of how great software is built. This isn't just a `git log`—it's a living data sculpture.

[Link](https://reposcape.netlify.app/) 


---

## ✨ The "DAAAAAMMMMN!!!!" Factor

This project was built to be a true **WOW level experience**. Here's what makes it special:

* **Cinematic "Time Machine" Animation:** When you fetch a repository, the scene starts empty and the graph builds itself chronologically, with a dynamic camera that follows the action like a drone flying through a growing city.
* **3D Branching Graph:** See the project's history as a 3D network. The `main` branch forms a golden central highway, while feature branches split off and merge back in, creating a beautiful, complex structure.
* **Data-Driven Architecture:** The height and color of each "commit skyscraper" represent the amount of work done. Tall, red towers are massive features; small, blue blocks are minor fixes.
* **Highlighted Merge Events:** Merge commits are rendered as glowing spheres, and the connecting lines are a vibrant green, clearly marking the exact points where different streams of work came together.
* **Polished Futuristic UI:** The entire interface, from the "frosted glass" panels to the glowing borders and technical font, is designed to feel like a sci-fi command console.
* **Fully Interactive:** Fly through the entire graph with map-style controls, hover over any commit to see it glow, and click to get detailed information, including the author's GitHub avatar.

---

## 🛠️ Tech Stack

RepoScape is built with a modern, powerful tech stack:

* **Framework:** [React](https://react.dev/) (with Vite for a super-fast development experience)
* **3D Rendering:** [Three.js](https://threejs.org/)
* **React + Three.js Integration:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
* **Helpers & Controls:** [React Three Drei](https://github.com/pmndrs/drei) (for MapControls, Text, and Lines)
* **Post-Processing:** [React Postprocessing](https://github.com/pmndrs/react-postprocessing) (for the Bloom/glow effect)
* **API:** [GitHub REST API](https://docs.github.com/en/rest)

---

## ⚙️ How to Run Locally

To get RepoScape running on your own machine, follow these simple steps.

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/your-username/reposcape-project.git](https://github.com/your-username/reposcape-project.git)
    cd reposcape-project
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set Up Your GitHub API Token (Crucial!)**
    The app needs a GitHub API token to avoid being rate-limited.
    * Go to your [GitHub Tokens page](https://github.com/settings/tokens) and generate a new **classic** token. You don't need to give it any special permissions.
    * In the root of your project, create a new file named `.env.local`.
    * Add the following line to that file, pasting your token:
        ```
        VITE_GITHUB_TOKEN=ghp_YourSecretTokenStringHere...
        ```

4.  **Start the Development Server**
    ```bash
    npm run dev
    ```
    Your browser should automatically open to `localhost:5173`. GGs!

---

## 🗺️ Understanding the Visualization

The graph tells a story. Here's how to read it:

| Element               | Meaning                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| **Golden Towers** | The central `main` or `master` branch—the project's official timeline.  |
| **Blue-Red Towers** | Feature branches. Blue = small changes, Red = large changes.            |
| **Glowing Spheres** | A **merge commit**, where one branch was combined into another.         |
| **Green Lines** | The path of a **merge**, showing a feature being integrated.          |
| **Grey Lines** | The linear history connecting commits on the same branch.               |
| **Timeline Direction**| The graph animates from the **oldest** commits to the **newest**.     |

---

## 🚀 Future Ideas

While this project is complete, here are some more "WOW" ideas that could be added:

* **"Fog of War" Mode:** Instead of an animation, the graph loads instantly but is shrouded in fog. The history is revealed as you fly your camera through it.
* **File-Level Details:** Clicking a commit could show which specific files were changed.
* **Contributor View:** A different mode that arranges the graph by author, showing who worked on what.

---

GGs, and have fun exploring the hidden cities inside your favorite codebases!
