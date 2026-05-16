import type { RequestHandler } from "express";

import { HttpError } from "../../errors/http-error";
import { getRequiredAuth } from "../auth/auth.middleware";
import {
  createDashboardEndpoint,
  createDashboardEndpointBoundary,
  createDashboardEndpointField,
  deleteDashboardEndpoint,
  deleteDashboardEndpointBoundary,
  deleteDashboardEndpointField,
  getDashboardEndpoint,
  listDashboardEndpoints,
  reorderDashboardEndpointFields,
  reorderDashboardEndpoints,
  updateDashboardEndpoint,
  updateDashboardEndpointBoundary,
  updateDashboardEndpointField,
} from "./dashboard-endpoints.service";
import {
  validateDashboardEndpointBoundaryCreateBody,
  validateDashboardEndpointBoundaryUpdateBody,
  validateDashboardEndpointCreateBody,
  validateDashboardEndpointFieldCreateBody,
  validateDashboardEndpointFieldReorderBody,
  validateDashboardEndpointFieldUpdateBody,
  validateDashboardEndpointReorderBody,
  validateDashboardEndpointUpdateBody,
} from "./dashboard-endpoints.validators";

function validationError(errors: string[]): HttpError {
  return new HttpError(400, `Validation failed: ${errors.join("; ")}`);
}

function endpointMutationError(reason: string): HttpError {
  if (reason === "SLUG_CONFLICT") {
    return new HttpError(409, "Endpoint slug is already taken");
  }

  return new HttpError(404, "Dashboard endpoint not found");
}

function fieldMutationError(reason: string): HttpError {
  if (reason === "INVALID_FIELD_OPTIONS") {
    return new HttpError(
      400,
      "Field options must match the selected field type",
    );
  }

  return new HttpError(404, "Dashboard endpoint field not found");
}

export const getDashboardEndpoints: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const endpoints = await listDashboardEndpoints(auth.profile.id);

    res.status(200).json(endpoints);
  } catch (error) {
    next(error);
  }
};

export const postDashboardEndpoint: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateDashboardEndpointCreateBody(req.body);

    if (!validation.ok) {
      throw validationError(validation.errors);
    }

    const result = await createDashboardEndpoint(
      auth.profile.id,
      validation.value,
    );

    if (!result.ok) {
      throw endpointMutationError(result.reason);
    }

    res.status(201).json(result.value);
  } catch (error) {
    next(error);
  }
};

export const getDashboardEndpointById: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const endpoint = await getDashboardEndpoint(
      auth.profile.id,
      req.params.endpointId ?? "",
    );

    if (!endpoint) {
      throw new HttpError(404, "Dashboard endpoint not found");
    }

    res.status(200).json(endpoint);
  } catch (error) {
    next(error);
  }
};

export const patchDashboardEndpoint: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateDashboardEndpointUpdateBody(req.body);

    if (!validation.ok) {
      throw validationError(validation.errors);
    }

    const result = await updateDashboardEndpoint(
      auth.profile.id,
      req.params.endpointId ?? "",
      validation.value,
    );

    if (!result.ok) {
      throw endpointMutationError(result.reason);
    }

    res.status(200).json(result.value);
  } catch (error) {
    next(error);
  }
};

export const deleteDashboardEndpointById: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const result = await deleteDashboardEndpoint(
      auth.profile.id,
      req.params.endpointId ?? "",
    );

    if (!result.ok) {
      if (result.reason === "HAS_SUBMISSIONS") {
        throw new HttpError(409, "Endpoint has submissions. Archive it instead.");
      }

      throw new HttpError(404, "Dashboard endpoint not found");
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const patchDashboardEndpointsReorder: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateDashboardEndpointReorderBody(req.body);

    if (!validation.ok) {
      throw validationError(validation.errors);
    }

    const result = await reorderDashboardEndpoints(
      auth.profile.id,
      validation.value.orderedIds,
    );

    if (!result.ok) {
      throw new HttpError(
        400,
        "orderedIds must contain exactly all endpoint ids for this profile",
      );
    }

    res.status(200).json(result.value);
  } catch (error) {
    next(error);
  }
};

export const postDashboardEndpointField: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateDashboardEndpointFieldCreateBody(req.body);

    if (!validation.ok) {
      throw validationError(validation.errors);
    }

    const result = await createDashboardEndpointField(
      auth.profile.id,
      req.params.endpointId ?? "",
      validation.value,
    );

    if (!result.ok) {
      throw fieldMutationError(result.reason);
    }

    res.status(201).json(result.value);
  } catch (error) {
    next(error);
  }
};

export const patchDashboardEndpointField: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateDashboardEndpointFieldUpdateBody(req.body);

    if (!validation.ok) {
      throw validationError(validation.errors);
    }

    const result = await updateDashboardEndpointField(
      auth.profile.id,
      req.params.endpointId ?? "",
      req.params.fieldId ?? "",
      validation.value,
    );

    if (!result.ok) {
      throw fieldMutationError(result.reason);
    }

    res.status(200).json(result.value);
  } catch (error) {
    next(error);
  }
};

export const deleteDashboardEndpointFieldById: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const didDelete = await deleteDashboardEndpointField(
      auth.profile.id,
      req.params.endpointId ?? "",
      req.params.fieldId ?? "",
    );

    if (!didDelete) {
      throw new HttpError(404, "Dashboard endpoint field not found");
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const patchDashboardEndpointFieldsReorder: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateDashboardEndpointFieldReorderBody(req.body);

    if (!validation.ok) {
      throw validationError(validation.errors);
    }

    const result = await reorderDashboardEndpointFields(
      auth.profile.id,
      req.params.endpointId ?? "",
      validation.value.orderedIds,
    );

    if (!result.ok) {
      if (result.reason === "NOT_FOUND") {
        throw new HttpError(404, "Dashboard endpoint not found");
      }

      throw new HttpError(
        400,
        "orderedIds must contain exactly all field ids for this endpoint",
      );
    }

    res.status(200).json(result.value);
  } catch (error) {
    next(error);
  }
};

export const postDashboardEndpointBoundary: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateDashboardEndpointBoundaryCreateBody(req.body);

    if (!validation.ok) {
      throw validationError(validation.errors);
    }

    const result = await createDashboardEndpointBoundary(
      auth.profile.id,
      req.params.endpointId ?? "",
      validation.value,
    );

    if (!result.ok) {
      throw new HttpError(404, "Dashboard endpoint not found");
    }

    res.status(201).json(result.value);
  } catch (error) {
    next(error);
  }
};

export const patchDashboardEndpointBoundary: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const validation = validateDashboardEndpointBoundaryUpdateBody(req.body);

    if (!validation.ok) {
      throw validationError(validation.errors);
    }

    const result = await updateDashboardEndpointBoundary(
      auth.profile.id,
      req.params.endpointId ?? "",
      req.params.boundaryId ?? "",
      validation.value,
    );

    if (!result.ok) {
      throw new HttpError(404, "Dashboard endpoint boundary not found");
    }

    res.status(200).json(result.value);
  } catch (error) {
    next(error);
  }
};

export const deleteDashboardEndpointBoundaryById: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const auth = getRequiredAuth(req);
    const didDelete = await deleteDashboardEndpointBoundary(
      auth.profile.id,
      req.params.endpointId ?? "",
      req.params.boundaryId ?? "",
    );

    if (!didDelete) {
      throw new HttpError(404, "Dashboard endpoint boundary not found");
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
