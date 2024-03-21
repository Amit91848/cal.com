-- CreateTable
CREATE TABLE "BookingLimits" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "bookingLimits" JSONB,

    CONSTRAINT "BookingLimits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingLimits_userId_key" ON "BookingLimits"("userId");

-- AddForeignKey
ALTER TABLE "BookingLimits" ADD CONSTRAINT "BookingLimits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
