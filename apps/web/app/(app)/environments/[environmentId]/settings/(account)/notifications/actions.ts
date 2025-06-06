"use server";

import { updateUser } from "@/lib/user/service";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { z } from "zod";
import { ZUserNotificationSettings } from "@formbricks/types/user";

const ZUpdateNotificationSettingsAction = z.object({
  notificationSettings: ZUserNotificationSettings,
});

export const updateNotificationSettingsAction = authenticatedActionClient
  .schema(ZUpdateNotificationSettingsAction)
  .action(async ({ ctx, parsedInput }) => {
    await updateUser(ctx.user.id, {
      notificationSettings: parsedInput.notificationSettings,
    });
  });
