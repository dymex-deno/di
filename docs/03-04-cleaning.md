# Cleaning

<!-- TOC depthFrom:1 depthTo:3 -->

- [Cleaning](#cleaning)
  - [Clearing Instances](#clearing-instances)
  - [Reset](#reset)

<!-- /TOC -->

## Clearing Instances

It's possible to clean all instances associated with registrations from the
container with `clearInstances`

```typescript
clearInstances(): Promise<void>;
```

**NOTE:** This method is async because of the disposition of instances that may
implement `AsyncDispose`

## Reset

To clean all the scopes and registrations associated with the container, use
`reset()`

```typescript
reset(): Promise<void>;
```

**NOTE:** This method is async because of the disposition of instances that may
implement `AsyncDispose`
