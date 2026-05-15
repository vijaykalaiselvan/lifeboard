import prisma from "../lib/prisma.js";

export async function requireProfile(req, res, next) {
  const profileId = Number(req.headers["x-profile-id"]);
  if (!profileId || isNaN(profileId)) {
    return res.status(400).json({ error: "Missing or invalid x-profile-id header" });
  }
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: req.userId },
  });
  if (!profile) return res.status(403).json({ error: "Profile not found or access denied" });
  req.profileId = profileId;
  next();
}
