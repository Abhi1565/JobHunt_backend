import { Company } from "../models/company.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const registerCompany = async (req, res) => {
    try {
        const { companyName } = req.body;
        if (!companyName) {
            return res.status(400).json({
                message: "Company name is required.",
                success: false
            });
        }
        let company = await Company.findOne({ name: companyName });
        if (company) {
            return res.status(400).json({
                message: "You can't register same company.",
                success: false
            })
        };
        company = await Company.create({
            name: companyName,
            userId: req.id
        });

        return res.status(201).json({
            message: "Company registered successfully.",
            company,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
export const getCompany = async (req, res) => {
    try {
        // Since this route is now public, return all companies
        const companies = await Company.find({});
        if (!companies) {
            return res.status(404).json({
                message: "Companies not found.",
                success: false
            })
        }
        return res.status(200).json({
            companies,
            success: true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
// get company by id
export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            })
        }
        return res.status(200).json({
            company,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
export const updateCompany = async (req, res) => {
    try {
        const { name, description, website, location } = req.body;

        const file = req.file;
        let logo;
        if (file) {
            let cloudResponse;
            // Check mimetype for PDF
            if (file.mimetype === 'application/pdf') {
                const streamUpload = (buffer) => {
                  return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                      {
                        resource_type: 'raw',
                        public_id: `company_docs/${req.params.id}_${Date.now()}.pdf`,
                        access_mode: 'public',
                        use_filename: false,
                        unique_filename: true
                      },
                      (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                      }
                    );
                    stream.end(buffer);
                  });
                };
                cloudResponse = await streamUpload(file.buffer);
            } else {
                const fileUri = getDataUri(file);
                cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                    resource_type: 'image',
                    public_id: `company_logos/${req.params.id}_${Date.now()}`,
                    access_mode: 'public'
                });
            }
            logo = cloudResponse.secure_url;
        }

        const updateData = { name, description, website, location };
        if (logo) updateData.logo = logo;

        const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            })
        }
        return res.status(200).json({
            message: "Company information updated.",
            success: true
        })

    } catch (error) {
        console.log(error);
    }
}