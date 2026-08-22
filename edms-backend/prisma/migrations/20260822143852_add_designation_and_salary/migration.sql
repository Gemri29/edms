-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "basic_salary" DECIMAL(12,2),
ADD COLUMN     "designation_eid" TEXT,
ADD COLUMN     "housing_salary" DECIMAL(12,2),
ADD COLUMN     "total_salary" DECIMAL(12,2),
ADD COLUMN     "transpo_allowance" DECIMAL(12,2);
