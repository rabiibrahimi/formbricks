import { getMembershipByUserIdOrganizationId } from "@/lib/membership/service";
import { getProjectByEnvironmentId } from "@/lib/project/service";
import { environmentIdLayoutChecks } from "@/modules/environments/lib/utils";
import { cleanup, render, screen } from "@testing-library/react";
import { Session } from "next-auth";
import { redirect } from "next/navigation";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TMembership } from "@formbricks/types/memberships";
import { TOrganization } from "@formbricks/types/organizations";
import { TProject } from "@formbricks/types/project";
import { TUser } from "@formbricks/types/user";
import EnvLayout from "./layout";

// Mock sub-components to render identifiable elements
vi.mock("@/app/(app)/environments/[environmentId]/components/EnvironmentLayout", () => ({
  EnvironmentLayout: ({ children }: any) => <div data-testid="EnvironmentLayout">{children}</div>,
}));
vi.mock("@/modules/ui/components/environmentId-base-layout", () => ({
  EnvironmentIdBaseLayout: ({ children, environmentId }: any) => (
    <div data-testid="EnvironmentIdBaseLayout">
      {environmentId}
      {children}
    </div>
  ),
}));
vi.mock("@/modules/ui/components/toaster-client", () => ({
  ToasterClient: () => <div data-testid="ToasterClient" />,
}));
vi.mock("./components/EnvironmentStorageHandler", () => ({
  default: ({ environmentId }: any) => <div data-testid="EnvironmentStorageHandler">{environmentId}</div>,
}));

// Mocks for dependencies
vi.mock("@/modules/environments/lib/utils", () => ({
  environmentIdLayoutChecks: vi.fn(),
}));
vi.mock("@/lib/project/service", () => ({
  getProjectByEnvironmentId: vi.fn(),
}));
vi.mock("@/lib/membership/service", () => ({
  getMembershipByUserIdOrganizationId: vi.fn(),
}));

describe("EnvLayout", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders successfully when all dependencies return valid data", async () => {
    vi.mocked(environmentIdLayoutChecks).mockResolvedValueOnce({
      t: ((key: string) => key) as any, // Mock translation function, we don't need to implement it for the test
      session: { user: { id: "user1" } } as Session,
      user: { id: "user1", email: "user1@example.com" } as TUser,
      organization: { id: "org1", name: "Org1", billing: {} } as TOrganization,
    });
    vi.mocked(getProjectByEnvironmentId).mockResolvedValueOnce({ id: "proj1" } as TProject);
    vi.mocked(getMembershipByUserIdOrganizationId).mockResolvedValueOnce({
      id: "member1",
    } as unknown as TMembership);

    const result = await EnvLayout({
      params: Promise.resolve({ environmentId: "env1" }),
      children: <div data-testid="child">Content</div>,
    });
    render(result);

    expect(screen.getByTestId("EnvironmentIdBaseLayout")).toHaveTextContent("env1");
    expect(screen.getByTestId("EnvironmentStorageHandler")).toHaveTextContent("env1");
    expect(screen.getByTestId("EnvironmentLayout")).toBeDefined();
    expect(screen.getByTestId("child")).toHaveTextContent("Content");
  });

  test("throws error if project is not found", async () => {
    vi.mocked(environmentIdLayoutChecks).mockResolvedValueOnce({
      t: ((key: string) => key) as any,
      session: { user: { id: "user1" } } as Session,
      user: { id: "user1", email: "user1@example.com" } as TUser,
      organization: { id: "org1", name: "Org1", billing: {} } as TOrganization,
    });
    vi.mocked(getProjectByEnvironmentId).mockResolvedValueOnce(null);
    vi.mocked(getMembershipByUserIdOrganizationId).mockResolvedValueOnce({
      id: "member1",
    } as unknown as TMembership);

    await expect(
      EnvLayout({
        params: Promise.resolve({ environmentId: "env1" }),
        children: <div>Content</div>,
      })
    ).rejects.toThrow("common.project_not_found");
  });

  test("throws error if membership is not found", async () => {
    vi.mocked(environmentIdLayoutChecks).mockResolvedValueOnce({
      t: ((key: string) => key) as any,
      session: { user: { id: "user1" } } as Session,
      user: { id: "user1", email: "user1@example.com" } as TUser,
      organization: { id: "org1", name: "Org1", billing: {} } as TOrganization,
    });
    vi.mocked(getProjectByEnvironmentId).mockResolvedValueOnce({ id: "proj1" } as TProject);
    vi.mocked(getMembershipByUserIdOrganizationId).mockResolvedValueOnce(null);

    await expect(
      EnvLayout({
        params: Promise.resolve({ environmentId: "env1" }),
        children: <div>Content</div>,
      })
    ).rejects.toThrow("common.membership_not_found");
  });

  test("calls redirect when session is null", async () => {
    vi.mocked(environmentIdLayoutChecks).mockResolvedValueOnce({
      t: ((key: string) => key) as any,
      session: undefined as unknown as Session,
      user: undefined as unknown as TUser,
      organization: { id: "org1", name: "Org1", billing: {} } as TOrganization,
    });
    vi.mocked(redirect).mockImplementationOnce(() => {
      throw new Error("Redirect called");
    });

    await expect(
      EnvLayout({
        params: Promise.resolve({ environmentId: "env1" }),
        children: <div>Content</div>,
      })
    ).rejects.toThrow("Redirect called");
  });

  test("throws error if user is null", async () => {
    vi.mocked(environmentIdLayoutChecks).mockResolvedValueOnce({
      t: ((key: string) => key) as any,
      session: { user: { id: "user1" } } as Session,
      user: undefined as unknown as TUser,
      organization: { id: "org1", name: "Org1", billing: {} } as TOrganization,
    });

    vi.mocked(redirect).mockImplementationOnce(() => {
      throw new Error("Redirect called");
    });

    await expect(
      EnvLayout({
        params: Promise.resolve({ environmentId: "env1" }),
        children: <div>Content</div>,
      })
    ).rejects.toThrow("common.user_not_found");
  });
});
