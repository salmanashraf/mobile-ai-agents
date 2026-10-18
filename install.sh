#!/bin/bash

# Mobile AI Agents — One-command installer
# Usage: ./install.sh [--platform android|ios|flutter|rn|gaming|all] [--tool claude|cursor|windsurf|copilot|codex|all]

set -e

PLATFORM="all"
TOOL="claude"
CLAUDE_AGENTS_DIR="$HOME/.claude/agents"
CLAUDE_COMMANDS_DIR="$HOME/.claude/commands"

# Parse args
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --platform) PLATFORM="$2"; shift ;;
        --tool) TOOL="$2"; shift ;;
        android|ios|flutter|rn|gaming) PLATFORM="$1" ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo ""
echo "Mobile AI Agents Installer"
echo "Platform: $PLATFORM | Tool: $TOOL"
echo ""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Copy a file to a destination, print a dot on success
_cp() {
    local src="$1" dst="$2"
    if [[ -f "$src" ]]; then
        cp "$src" "$dst"
    else
        echo "  [WARN] missing: $src"
    fi
}

# Build list of agent source paths for the current platform selection
# Outputs: "<name> <src_path>" lines
_agent_lines() {
    # Cross-platform (always)
    for agent in appforge crasher launchpad sentinel pipeline scribe perf figma \
                 mobile-harness mobile-memory \
                 accessibility-auditor ci-cd-generator release-notes-generator \
                 security-scanner store-listing-writer; do
        src="agents/cross-platform/$agent/agent.md"
        [[ -f "$src" ]] && echo "$agent $src"
    done

    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
        echo "anr-investigation      agents/android/anr-investigation/agent.md"
        echo "axiom                  agents/android/axiom/agent.md"
        echo "android-crash-analyzer agents/android/android-crash-analyzer/agent.md"
        echo "android-code-reviewer  agents/android/code-reviewer/agent.md"
        echo "compose-navigation     agents/android/compose-navigation/agent.md"
        echo "compose-screen-builder agents/android/compose-screen-builder/agent.md"
        echo "compose-ui-reviewer    agents/android/compose-ui-reviewer/agent.md"
        echo "android-crash-analyzer-v2 agents/android/crash-analyzer/agent.md"
        echo "memory-leak-analyzer   agents/android/memory-leak-analyzer/agent.md"
    fi

    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
        echo "swift          agents/ios/swift/agent.md"
        echo "ios-crash-analyzer agents/ios/crash-analyzer/agent.md"
        echo "swift-reviewer agents/ios/swift-reviewer/agent.md"
    fi

    if [[ "$PLATFORM" == "flutter" || "$PLATFORM" == "all" ]]; then
        echo "dart                agents/flutter/dart/agent.md"
        echo "bloc-feature-builder agents/flutter/bloc-feature-builder/agent.md"
        echo "widget-generator    agents/flutter/widget-generator/agent.md"
    fi

    if [[ "$PLATFORM" == "rn" || "$PLATFORM" == "all" ]]; then
        echo "bridge                 agents/react-native/bridge/agent.md"
        echo "rn-performance-optimizer agents/react-native/performance-optimizer/agent.md"
    fi

    if [[ "$PLATFORM" == "gaming" || "$PLATFORM" == "all" ]]; then
        echo "forge            agents/gaming/forge/agent.md"
        echo "unreal           agents/gaming/unreal/agent.md"
        echo "shader-generator agents/unity/shader-generator/agent.md"
        echo "blueprint-advisor agents/unreal/blueprint-advisor/agent.md"
    fi
}

# Build list of skill source paths for the current platform selection
# Outputs: "<slug> <src_path>" lines
_skill_lines() {
    # Cross-platform skills (always)
    echo "web-network-to-mobile skills/cross-platform/web-network-to-mobile.md"
    echo "grill-mobile        skills/cross-platform/grill-mobile.md"
    echo "crash-triage        skills/cross-platform/crash-triage.md"
    echo "perf-audit          skills/cross-platform/perf-audit.md"
    echo "clean-code-audit    skills/cross-platform/clean-code-audit.md"
    echo "security-audit      skills/cross-platform/security-audit.md"
    echo "store-listing       skills/cross-platform/store-listing.md"
    echo "release-prep        skills/cross-platform/release-prep.md"
    echo "feature-slice       skills/cross-platform/feature-slice.md"
    echo "mobile-mcp-qa       skills/cross-platform/mobile-mcp-qa.md"
    echo "mobile-memory-save        skills/cross-platform/mobile-memory-save.md"
    echo "mobile-memory-graph       skills/cross-platform/mobile-memory-graph.md"
    echo "mobile-memory-search      skills/cross-platform/mobile-memory-search.md"
    echo "accessibility-audit skills/cross-platform/accessibility-audit.md"
    echo "api-versioning      skills/cross-platform/api-versioning.md"
    echo "deeplink-debug      skills/cross-platform/deeplink-debug.md"
    echo "crash-analysis      skills/shared/crash-analysis.md"
    echo "security-scan       skills/shared/security-scan.md"
    echo "shared-accessibility-audit skills/shared/accessibility-audit.md"

    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
        echo "anr-investigation skills/android/anr-investigation.md"
        echo "android-tdd       skills/android/android-tdd.md"
        echo "compose-review    skills/android/compose-review.md"
        echo "compose-migration skills/android/compose-migration.md"
        echo "kotlin-modernize  skills/android/kotlin-modernize.md"
        echo "memory-leak-investigation skills/android/memory-leak-investigation.md"
        echo "android-code-review skills/android/code-review.md"
        echo "proguard-rules    skills/android/proguard-rules.md"
    fi

    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
        echo "ios-tdd            skills/ios/ios-tdd.md"
        echo "swiftui-review     skills/ios/swiftui-review.md"
        echo "swift-review       skills/ios/swift-review.md"
        echo "swiftui-state      skills/ios/swiftui-state.md"
        echo "swift-concurrency  skills/ios/swift-concurrency.md"
        echo "data-persistence   skills/ios/data-persistence.md"
        echo "ios-networking     skills/ios/networking.md"
        echo "ios-performance    skills/ios/performance.md"
        echo "ios-unit-testing   skills/ios/unit-testing.md"
        echo "xcode-warnings     skills/ios/xcode-warnings.md"
    fi

    if [[ "$PLATFORM" == "flutter" || "$PLATFORM" == "all" ]]; then
        echo "flutter-tdd     skills/flutter/flutter-tdd.md"
        echo "flutter-review  skills/flutter/flutter-review.md"
        echo "dart-modernize  skills/flutter/dart-modernize.md"
        echo "widget-extract  skills/flutter/widget-extract.md"
        echo "widget-gen      skills/flutter/widget-gen.md"
    fi

    if [[ "$PLATFORM" == "rn" || "$PLATFORM" == "all" ]]; then
        echo "rn-tdd          skills/react-native/rn-tdd.md"
        echo "rn-review       skills/react-native/rn-review.md"
        echo "bridge-audit    skills/react-native/bridge-audit.md"
        echo "expo-optimize   skills/react-native/expo-optimize.md"
        echo "new-arch-migrate skills/react-native/new-arch-migrate.md"
        echo "rn-performance  skills/react-native/performance.md"
    fi

    if [[ "$PLATFORM" == "gaming" || "$PLATFORM" == "all" ]]; then
        echo "shader-gen       skills/gaming/shader-gen.md"
        echo "game-perf        skills/gaming/game-perf.md"
        echo "blueprint-to-cpp skills/gaming/blueprint-to-cpp.md"
        echo "unity-tdd        skills/gaming/unity-tdd.md"
        echo "shader-review    skills/unity/shader-review.md"
    fi
}

# Build list of workflow source paths (always all)
# Outputs: "<name> <src_path>" lines
_workflow_lines() {
    for wf in feature-ship release-cycle game-level crash-to-fix ci-setup \
               new-screen new-project-setup app-launch perf-sprint mobile-memory-workflow \
               appforge-workflow mobile-mcp-qa mobile-harness; do
        echo "$wf workflows/$wf.md"
    done
}

# ---------------------------------------------------------------------------
# Install: Claude Code
# ---------------------------------------------------------------------------
install_claude() {
    mkdir -p "$CLAUDE_AGENTS_DIR"
    mkdir -p "$CLAUDE_COMMANDS_DIR"

    echo "→ Installing agents..."
    while IFS=" " read -r name src; do
        name=$(echo "$name" | xargs)   # trim whitespace
        src=$(echo "$src" | xargs)
        _cp "$src" "$CLAUDE_AGENTS_DIR/$name.md"
        _cp "$src" "$CLAUDE_COMMANDS_DIR/$name.md"
    done < <(_agent_lines)

    echo "→ Installing skills..."
    while IFS=" " read -r slug src; do
        slug=$(echo "$slug" | xargs)
        src=$(echo "$src" | xargs)
        _cp "$src" "$CLAUDE_COMMANDS_DIR/$slug.md"
    done < <(_skill_lines)

    echo "→ Installing workflows..."
    while IFS=" " read -r name src; do
        name=$(echo "$name" | xargs)
        src=$(echo "$src" | xargs)
        _cp "$src" "$CLAUDE_COMMANDS_DIR/$name.md"
    done < <(_workflow_lines)

    echo ""
    echo "Installed to:"
    echo "   Agents   → $CLAUDE_AGENTS_DIR"
    echo "   Commands → $CLAUDE_COMMANDS_DIR"
    echo ""
    echo "   Slash commands available:"
    echo ""
    echo "   Cross-platform agents:"
    echo "   /appforge  /crasher  /sentinel  /mobile-harness  /mobile-memory"
    echo "   /scribe  /pipeline  /perf  /launchpad  /figma"
    echo "   /accessibility-auditor  /ci-cd-generator  /release-notes-generator"
    echo "   /security-scanner  /store-listing-writer"
    echo ""
    echo "   Cross-platform skills:"
    echo "   /web-network-to-mobile"
    echo "   /grill-mobile  /clean-code-audit  /security-audit  /crash-triage"
    echo "   /perf-audit  /store-listing  /release-prep"
    echo "   /feature-slice  /mobile-mcp-qa  /mobile-memory-save  /mobile-memory-graph"
    echo "   /mobile-memory-search"
    echo "   /accessibility-audit"
    echo "   /api-versioning  /deeplink-debug"
    echo "   /crash-analysis  /security-scan  /shared-accessibility-audit"
    echo ""
    echo "   Workflows:"
    echo "   /feature-ship  /release-cycle  /crash-to-fix  /ci-setup  /new-screen"
    echo "   /new-project-setup  /app-launch  /perf-sprint  /game-level"
    echo "   /mobile-memory-workflow  /appforge-workflow  /mobile-mcp-qa  /mobile-harness"
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
    echo ""
    echo "   Android agents:"
    echo "   /anr-investigation  /axiom  /android-crash-analyzer"
    echo "   /android-crash-analyzer-v2"
    echo "   /android-code-reviewer  /compose-navigation"
    echo "   /compose-screen-builder  /compose-ui-reviewer"
    echo "   /memory-leak-analyzer"
    echo "   Android skills:"
    echo "   /anr-investigation  /android-tdd  /compose-review  /compose-migration"
    echo "   /kotlin-modernize  /memory-leak-investigation"
    echo "   /android-code-review  /proguard-rules"
    fi
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
    echo ""
    echo "   iOS agents:"
    echo "   /swift  /ios-crash-analyzer  /swift-reviewer"
    echo "   iOS skills:"
    echo "   /ios-tdd  /swiftui-review  /swift-review  /swiftui-state  /swift-concurrency"
    echo "   /data-persistence  /ios-networking  /ios-performance  /ios-unit-testing"
    echo "   /xcode-warnings"
    fi
    if [[ "$PLATFORM" == "flutter" || "$PLATFORM" == "all" ]]; then
    echo ""
    echo "   Flutter agents:"
    echo "   /dart  /bloc-feature-builder  /widget-generator"
    echo "   Flutter skills:"
    echo "   /flutter-tdd  /flutter-review  /dart-modernize  /widget-extract  /widget-gen"
    fi
    if [[ "$PLATFORM" == "rn" || "$PLATFORM" == "all" ]]; then
    echo ""
    echo "   React Native agents:"
    echo "   /bridge  /rn-performance-optimizer"
    echo "   React Native skills:"
    echo "   /rn-tdd  /rn-review  /bridge-audit  /expo-optimize  /new-arch-migrate"
    echo "   /rn-performance"
    fi
    if [[ "$PLATFORM" == "gaming" || "$PLATFORM" == "all" ]]; then
    echo ""
    echo "   Gaming agents:"
    echo "   /forge  /unreal  /shader-generator  /blueprint-advisor"
    echo "   Gaming skills:"
    echo "   /shader-gen  /game-perf  /blueprint-to-cpp  /unity-tdd  /shader-review"
    fi
    echo ""
}

# ---------------------------------------------------------------------------
# Install: Cursor (.cursor/rules/*.mdc)
# ---------------------------------------------------------------------------
install_cursor() {
    local rules_dir=".cursor/rules"
    mkdir -p "$rules_dir"
    echo "→ Installing for Cursor ($rules_dir/)..."

    while IFS=" " read -r name src; do
        name=$(echo "$name" | xargs)
        src=$(echo "$src" | xargs)
        if [[ -f "$src" ]]; then
            cp "$src" "$rules_dir/$name.mdc"
        fi
    done < <(_agent_lines)

    while IFS=" " read -r slug src; do
        slug=$(echo "$slug" | xargs)
        src=$(echo "$src" | xargs)
        if [[ -f "$src" ]]; then
            cp "$src" "$rules_dir/$slug.mdc"
        fi
    done < <(_skill_lines)

    while IFS=" " read -r name src; do
        name=$(echo "$name" | xargs)
        src=$(echo "$src" | xargs)
        if [[ -f "$src" ]]; then
            cp "$src" "$rules_dir/$name.mdc"
        fi
    done < <(_workflow_lines)

    echo "   $rules_dir/ created — reference agents with @axiom, @flutter-review, @crash-to-fix etc."
    echo ""
}

# ---------------------------------------------------------------------------
# Install: Windsurf (.windsurfrules)
# ---------------------------------------------------------------------------
install_windsurf() {
    echo "→ Installing for Windsurf (.windsurfrules)..."
    {
        echo "# Mobile AI Agents — AI dev team for mobile engineers"
        echo ""

        while IFS=" " read -r name src; do
            name=$(echo "$name" | xargs)
            src=$(echo "$src" | xargs)
            if [[ -f "$src" ]]; then
                echo "## AGENT: $name"
                echo ""
                cat "$src"
                echo ""
                echo "---"
                echo ""
            fi
        done < <(_agent_lines)

        while IFS=" " read -r slug src; do
            slug=$(echo "$slug" | xargs)
            src=$(echo "$src" | xargs)
            if [[ -f "$src" ]]; then
                echo "## SKILL: $slug"
                echo ""
                cat "$src"
                echo ""
                echo "---"
                echo ""
            fi
        done < <(_skill_lines)

        while IFS=" " read -r name src; do
            name=$(echo "$name" | xargs)
            src=$(echo "$src" | xargs)
            if [[ -f "$src" ]]; then
                echo "## WORKFLOW: $name"
                echo ""
                cat "$src"
                echo ""
                echo "---"
                echo ""
            fi
        done < <(_workflow_lines)
    } > .windsurfrules

    echo "   .windsurfrules created in current directory"
    echo ""
}

# ---------------------------------------------------------------------------
# Install: GitHub Copilot (.github/copilot-instructions.md)
# ---------------------------------------------------------------------------
install_copilot() {
    local out_dir=".github"
    local out_file="$out_dir/copilot-instructions.md"
    mkdir -p "$out_dir"
    echo "→ Installing for GitHub Copilot ($out_file)..."
    {
        echo "# Mobile AI Agents — AI dev team for mobile engineers"
        echo ""
        echo "Use the agent and skill definitions below to guide code generation, review, and"
        echo "refactoring across Android, iOS, Flutter, React Native, and gaming platforms."
        echo ""

        while IFS=" " read -r name src; do
            name=$(echo "$name" | xargs)
            src=$(echo "$src" | xargs)
            if [[ -f "$src" ]]; then
                echo "## AGENT: $name"
                echo ""
                cat "$src"
                echo ""
                echo "---"
                echo ""
            fi
        done < <(_agent_lines)

        while IFS=" " read -r slug src; do
            slug=$(echo "$slug" | xargs)
            src=$(echo "$src" | xargs)
            if [[ -f "$src" ]]; then
                echo "## SKILL: $slug"
                echo ""
                cat "$src"
                echo ""
                echo "---"
                echo ""
            fi
        done < <(_skill_lines)

        while IFS=" " read -r name src; do
            name=$(echo "$name" | xargs)
            src=$(echo "$src" | xargs)
            if [[ -f "$src" ]]; then
                echo "## WORKFLOW: $name"
                echo ""
                cat "$src"
                echo ""
                echo "---"
                echo ""
            fi
        done < <(_workflow_lines)
    } > "$out_file"

    echo "   $out_file created"
    echo ""
}

# ---------------------------------------------------------------------------
# Install: Codex / OpenAI (AGENTS.md)
# ---------------------------------------------------------------------------
install_codex() {
    local out_file="AGENTS.md"
    echo "→ Installing for Codex/OpenAI ($out_file)..."
    {
        echo "# Mobile AI Agents — AI dev team for mobile engineers"
        echo ""
        echo "Full system prompts, skills, and workflows for Android, iOS, Flutter,"
        echo "React Native, Unity, and Unreal development."
        echo ""

        while IFS=" " read -r name src; do
            name=$(echo "$name" | xargs)
            src=$(echo "$src" | xargs)
            if [[ -f "$src" ]]; then
                echo "## AGENT: $name"
                echo ""
                cat "$src"
                echo ""
                echo "---"
                echo ""
            fi
        done < <(_agent_lines)

        while IFS=" " read -r slug src; do
            slug=$(echo "$slug" | xargs)
            src=$(echo "$src" | xargs)
            if [[ -f "$src" ]]; then
                echo "## SKILL: $slug"
                echo ""
                cat "$src"
                echo ""
                echo "---"
                echo ""
            fi
        done < <(_skill_lines)

        while IFS=" " read -r name src; do
            name=$(echo "$name" | xargs)
            src=$(echo "$src" | xargs)
            if [[ -f "$src" ]]; then
                echo "## WORKFLOW: $name"
                echo ""
                cat "$src"
                echo ""
                echo "---"
                echo ""
            fi
        done < <(_workflow_lines)
    } > "$out_file"

    echo "   $out_file created in current directory"
    echo ""
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------
if [[ "$TOOL" == "claude" || "$TOOL" == "all" ]]; then
    install_claude
fi

if [[ "$TOOL" == "cursor" || "$TOOL" == "all" ]]; then
    install_cursor
fi

if [[ "$TOOL" == "windsurf" || "$TOOL" == "all" ]]; then
    install_windsurf
fi

if [[ "$TOOL" == "copilot" || "$TOOL" == "all" ]]; then
    install_copilot
fi

if [[ "$TOOL" == "codex" || "$TOOL" == "all" ]]; then
    install_codex
fi

echo "Mobile AI Agents installed. Happy shipping."
echo "   → github.com/salmanashraf/mobile-agency"
echo ""
